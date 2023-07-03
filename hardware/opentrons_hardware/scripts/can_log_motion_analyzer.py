#!/usr/bin/env python3
"""Analyze a can log of a motion and display encoder variance over time"""

from dataclasses import dataclass
import re
import sys
import argparse
import io
from datetime import datetime, timedelta
from typing import (
    Optional,
    List,
    Iterator,
    Union,
    TypeVar,
    Type,
    Set,
    TYPE_CHECKING,
    Any,
)
from typing_extensions import Literal
from itertools import chain, tee

from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.hardware_control.constants import interrupts_per_sec

if TYPE_CHECKING:
    import matplotlib.pyplot as pp  # type: ignore


class IgnoredMessage(BaseException):
    """Ignored."""

    pass


class NoRecords(BaseException):
    """No records for the given filters."""

    pass


RecordSlfType = TypeVar("RecordSlfType", bound="Record")


@dataclass
class Record:
    """Base record, instantiated only as an intermediate."""

    date: datetime
    sender: NodeId
    dest: NodeId

    def format_date_offset(self: RecordSlfType, date: datetime) -> str:
        """Print with a time offset from some other time rather than a timestamp."""
        return (
            f"{self.__class__.__name__}: offset={(self.date-date).total_seconds()}, sender={self.sender.name}, dest={self.dest.name}, "
            + self.format_fields()
        )

    def format_fields(self: RecordSlfType) -> str:
        """Subclasses implement to stringify under their own control."""
        raise NotImplementedError()

    def __str__(self) -> str:
        """String."""
        return f'{self.__class__.__name__}: date={self.date.strftime("%b %d %H:%M:%S")}.{self.date.time().microsecond/1000000}, sender={self.sender.name}, dest={self.dest.name}'


_MOVE_COMPLETE_RE = re.compile(
    r"MoveCompletedPayload"
    r".*message_index=UInt32Field\(value=(?P<index>\d+)\)"
    r".*seq_id=UInt8Field\(value=(?P<seq_id>\d+)\)"
    r".*current_position_um=UInt32Field\(value=(?P<current_position>\d+)\)"
    r".*encoder_position_um=Int32Field\(value=(?P<encoder_position>[-\d]+)\)"
)


@dataclass
class MoveComplete(Record):
    """Represents a MoveCompletedMessage."""

    @classmethod
    def from_payload_log(
        cls: Type["MoveComplete"], record: Record, line: str
    ) -> "MoveComplete":
        """Build from a log record."""
        data = _MOVE_COMPLETE_RE.search(line)
        assert data, f"Could not parse move complete payload from {line}"
        return MoveComplete(
            date=record.date,
            sender=record.sender,
            dest=record.dest,
            motor_pos=float(data["current_position"]) / 1000,
            encoder_pos=float(data["encoder_position"]) / 1000,
            index=int(data["index"]),
            seq_id=int(data["seq_id"]),
        )

    motor_pos: float
    encoder_pos: float
    index: int
    seq_id: int

    def __str__(self) -> str:
        """String."""
        return super().__str__() + ", " + self.format_fields()

    def format_fields(self) -> str:
        """Used by super to print values."""
        return f"motor_pos={self.motor_pos}, encoder_pos={self.encoder_pos}, index={self.index}, seq_id={self.seq_id}"


_ERROR_RE = re.compile(
    r"ErrorMessagePayload"
    r".*message_index=UInt32Field\(value=(?P<index>\d+)\)"
    r".*error_code=ErrorCodeField\(value=(?P<error>\w+)\)"
)


@dataclass
class Error(Record):
    """Represents an error message."""

    @classmethod
    def from_payload_log(cls: Type["Error"], record: Record, line: str) -> "Error":
        """Build from a log record."""
        data = _ERROR_RE.search(line)
        assert data, f"Could not parse error payload from {line}"
        return Error(
            date=record.date,
            sender=record.sender,
            dest=record.dest,
            error_type=data["error"],
            index=int(data["index"]),
        )

    error_type: str
    index: int

    def __str__(self) -> str:
        """String."""
        return super().__str__() + ", " + self.format_fields()

    def format_fields(self) -> str:
        """Used by super to print values."""
        return f"error_type={self.error_type}, index={self.index}"


_MOVE_RE = re.compile(
    r"AddLinearMoveRequestPayload\("
    r".*message_index=UInt32Field\(value=(?P<index>\d+)\)"
    r".*seq_id=UInt8Field\(value=(?P<seq_id>\d+)\)"
    r".*duration=UInt32Field\(value=(?P<duration>\d+)\)"
    r".*acceleration_um=Int32Field\(value=(?P<acceleration>[-\d]+)\)"
    r".*velocity_mm=Int32Field\(value=(?P<velocity>[-\d]+)\)"
)


@dataclass
class MoveCommand(Record):
    """Represents an AddLinearMoveRequest."""

    @classmethod
    def from_payload_log(
        cls: Type["MoveCommand"], record: Record, line: str
    ) -> "MoveCommand":
        """Build from a log line."""
        data = _MOVE_RE.search(line)
        assert data, f"Could not parse move command from {line}"
        return MoveCommand(
            date=record.date,
            sender=record.sender,
            dest=record.dest,
            seq_id=int(data["seq_id"]),
            duration=int(data["duration"]) / interrupts_per_sec,
            velocity=float(data["velocity"]) / (2**31) * interrupts_per_sec,
            acceleration=float(data["acceleration"])
            / (2**31)
            * interrupts_per_sec
            * interrupts_per_sec
            / 1000,
            index=int(data["index"]),
        )

    seq_id: int
    velocity: float
    acceleration: float
    duration: float
    index: int

    def __str__(self) -> str:
        """String."""
        return super().__str__() + ", " + self.format_fields()

    def format_fields(self) -> str:
        """Prints values."""
        return f"velocity={self.velocity}, acceleration={self.acceleration}, duration={self.duration}, seq_id={self.seq_id}, index={self.index}"


RecordType = Union[MoveCommand, Error, MoveComplete]
RecordTypeVar = TypeVar("RecordTypeVar", bound=Union[Record], covariant=True)


def _lines(logfile: io.TextIOBase) -> Iterator[str]:
    while True:
        res = logfile.readline()
        yield res
        if not res:
            return


_ARB_RE = re.compile(
    r"node_id: (?P<node_id>\w+), originating_node_id: (?P<originating_node_id>\w+),"
)


def _arb_from_line(line: str, date: datetime) -> Record:
    match = _ARB_RE.search(line)
    assert match, f"Could not find arbitration details in {line}"
    return Record(
        date=date,
        sender=NodeId[match["originating_node_id"]],
        dest=NodeId[match["node_id"]],
    )


def _send_record(payload_line: str, record: Record) -> MoveCommand:
    if "AddLinearMoveRequest" in payload_line:
        return MoveCommand.from_payload_log(record, payload_line)
    raise IgnoredMessage()


def _receive_record(payload_line: str, record: Record) -> Union[MoveComplete, Error]:
    if "ErrorMessage" in payload_line:
        return Error.from_payload_log(record, payload_line)
    if "MoveCompleted" in payload_line:
        return MoveComplete.from_payload_log(record, payload_line)
    raise IgnoredMessage()


def _gobble_to_next_record(lines: Iterator[str]) -> str:
    nextline = ""
    while "Received <--" not in nextline and "Sending -->" not in nextline:
        nextline = next(lines)
    return nextline


def _record(lines: Iterator[str]) -> Union[MoveCommand, MoveComplete, Error]:
    dirline = next(lines)
    if "." in dirline:
        ms_offset = timedelta(seconds=float("0." + dirline.split(".")[1].split(" ")[0]))
        date = (
            datetime.strptime(dirline.split(".")[0] + "+0000", "%b %d %H:%M:%S%z")
            + ms_offset
        )
    else:
        date = datetime.strptime(
            " ".join(dirline.split(" ")[:3]) + "+0000", "%b %H:%M:%S%z"
        )
    arbline = next(lines)
    record = _arb_from_line(arbline, date)
    payline = next(lines)
    if "Received" in dirline:
        return _receive_record(payline, record)
    if "Sending" in dirline:
        return _send_record(payline, record)

    raise KeyError(f"Bad direction line: {dirline}")


def records(logfile: io.TextIOBase) -> Iterator[Record]:
    """Parse a log into records."""
    lines = _lines(logfile)
    while True:
        try:
            first = _gobble_to_next_record(lines)
            yield _record(chain((first,), lines))
        except StopIteration:
            return
        except IgnoredMessage:
            continue


def receive_records(records: Iterator[Record]) -> Iterator[Union[MoveComplete, Error]]:
    """Filter only received messages."""
    for record in records:
        if isinstance(record, (MoveComplete, Error)):
            yield record


def complete_records(
    records: Union[Iterator[Record], Iterator[Union[MoveComplete, Error]]]
) -> Iterator[MoveComplete]:
    """Filter only move-complete."""
    for record in records:
        if isinstance(record, MoveComplete):
            yield record


def error_records(
    records: Union[Iterator[Record], Iterator[Union[MoveComplete, Error]]]
) -> Iterator[Error]:
    """Filter only errors."""
    for record in records:
        if isinstance(record, Error):
            yield record


def date_limited(
    records: Iterator[RecordTypeVar],
    since: Optional[datetime],
    until: Optional[datetime],
) -> Iterator[RecordTypeVar]:
    """Filter only records between specified dates."""
    for record in records:
        if since and since > record.date:
            continue
        if until and until < record.date:
            return
        yield record


def sender_limited(
    records: Iterator[RecordTypeVar], nodes: Set[NodeId]
) -> Iterator[RecordTypeVar]:
    """Filter only records of messages from nodes."""
    for record in records:
        if record.sender not in nodes:
            continue
        yield record


def dest_limited(
    records: Iterator[RecordTypeVar], nodes: Set[NodeId]
) -> Iterator[RecordTypeVar]:
    """Filter only records of messages to nodes."""
    for record in records:
        if record.dest not in nodes:
            continue
        yield record


@dataclass
class PositionLogEntry:
    """Quick class for a position log."""

    date: datetime
    motor_pos: float
    encoder_pos: float
    diff: float

    @classmethod
    def build_from_record(
        cls: Type["PositionLogEntry"], record: MoveComplete
    ) -> "PositionLogEntry":
        """Build from a record."""
        return PositionLogEntry(
            date=record.date,
            motor_pos=record.motor_pos,
            encoder_pos=record.encoder_pos,
            diff=record.motor_pos - record.encoder_pos,
        )

    def format_date_offset(self, date: datetime) -> str:
        """Print with a time offset."""
        return f"{self.__class__.__name__}: time={(self.date - date).total_seconds()}, motor_pos={self.motor_pos}, encoder_pos={self.encoder_pos}, diff={self.diff}"


def position_log(records: Iterator[MoveComplete]) -> Iterator[PositionLogEntry]:
    """Print a log of positions."""
    for record in records:
        yield PositionLogEntry(
            record.date,
            record.motor_pos,
            record.encoder_pos,
            record.motor_pos - record.encoder_pos,
        )


Operation = Literal["print-positions", "print-errors", "plot-positions"]
OPERATIONS: List[Operation] = ["print-positions", "print-errors", "plot-positions"]


def _print_positions(
    records_to_check: Iterator[RecordTypeVar],
    nodes: Set[NodeId],
    annotate_errors: bool,
) -> None:
    t0: Optional[datetime] = None
    for record in sender_limited(receive_records(records_to_check), nodes):
        if not t0:
            t0 = record.date
        if isinstance(record, Error):
            if not annotate_errors:
                continue
            print(record.format_date_offset(t0))
        else:
            print(
                f"{record.sender.name}: {PositionLogEntry.build_from_record(record).format_date_offset(t0)}"
            )


def _print_errors(
    records_to_check: Iterator[RecordTypeVar],
    nodes: Set[NodeId],
    annotate_errors: bool,
) -> None:
    if not annotate_errors:
        raise RuntimeError(
            "now how could i print errors without annotating them. cmon."
        )
    for record in sender_limited(error_records(records_to_check), nodes):
        print(record)


def main(
    operation: Operation,
    logfile: io.TextIOBase,
    nodes: Set[NodeId],
    since: Optional[datetime],
    until: Optional[datetime],
    annotate_errors: bool,
) -> None:
    """Main function."""
    records_to_check = date_limited(records(logfile), since, until)
    if operation == "print-positions":
        _print_positions(records_to_check, nodes, annotate_errors)
    elif operation == "print-errors":
        _print_errors(records_to_check, nodes, annotate_errors)
    elif operation == "plot-positions":
        print(f"plotting positions for {', '.join(n.name for n in nodes)}")
        ind_records = tee(records_to_check, len(nodes))
        plots = [
            PlotParams(
                records=date_limited(
                    sender_limited(receive_records(ind_records[index]), {node}),
                    since,
                    until,
                ),
                title=f"Position over time for {node.name}",
                annotate_errors=annotate_errors,
            )
            for index, node in enumerate(nodes)
        ]
        plot_position_errors(plots)


@dataclass
class PlotParams:
    """Gather plotting params for later iteration."""

    records: Iterator[Union[MoveComplete, Error]]
    title: str
    annotate_errors: bool


def plot_one(plot: PlotParams) -> "pp.Figure":  # noqa: C901
    """Plot a single figure. Requires pyplot."""
    import matplotlib.pyplot as pp

    time_offsets: List[float] = []
    absolute_encoder: List[float] = []
    absolute_motor: List[float] = []
    diff: List[float] = []
    t0: Optional[datetime] = None
    errors: List[Error] = []
    print(f"checking plot {plot}")
    for record in plot.records:
        if not t0:
            t0 = record.date

        if isinstance(record, MoveComplete):
            time_offsets.append((record.date - t0).total_seconds())
            absolute_encoder.append(record.encoder_pos)
            absolute_motor.append(record.motor_pos)
            diff.append(record.motor_pos - record.encoder_pos)
        elif isinstance(record, Error):
            errors.append(record)
    if not t0:
        raise NoRecords()

    fig, subplots = pp.subplots(
        nrows=2,
        ncols=1,
        sharex=True,
        squeeze=True,
    )
    fig.suptitle(plot.title)
    absolute_axes = subplots[0]
    diff_axes = subplots[1]

    absolute_axes.plot(time_offsets, absolute_encoder, color="b", label="encoder")
    absolute_axes.plot(time_offsets, absolute_motor, color="g", label="motor")
    diff_axes.plot(time_offsets, diff, color="b")
    dymin, dymax = diff_axes.get_ylim()
    dymin = max(dymin, -1.0)
    dymax = min(dymax, 1.0)
    diff_axes.set_ylim(dymin, dymax)

    abs_max, abs_min = absolute_axes.dataLim.ymax, absolute_axes.dataLim.ymin
    diff_max, diff_min = diff_axes.dataLim.ymax, diff_axes.dataLim.ymin
    for error in errors:
        absolute_axes.vlines(
            x=(error.date - t0).total_seconds(), ymin=abs_min, ymax=abs_max, colors="r"
        )
        diff_axes.vlines(
            x=(error.date - t0).total_seconds(),
            ymin=diff_min,
            ymax=diff_max,
            colors="r",
        )
        error_time = (error.date - t0).total_seconds()
        try:
            error_data_index = time_offsets.index(
                next(t for t in time_offsets if t >= error_time)
            )
        except StopIteration:
            error_data_index = -1
            print(f"no data for error at {error_time}")
        diff_axes.annotate(
            text=error.error_type,
            xy=((error.date - t0).total_seconds(), diff[error_data_index]),
            color="r",
            rotation="vertical",
            fontsize="xx-small",
            horizontalalignment="left",
        )

    absolute_axes.legend()

    absolute_axes.set_title("e position (mm) vs time (s) of motor and encoder")
    absolute_axes.set_ylabel("Absolute position (mm)")
    diff_axes.set_title(
        "Position difference (mm) vs time (s) between motor and encoder"
    )
    diff_axes.set_ylabel("Position difference (mm)")
    diff_axes.set_xlabel("time since beginning of log (s)")

    annvline_abs = absolute_axes.axvline(x=0, color="k")
    annvline_diff = diff_axes.axvline(x=0, color="k")
    annvline_abs.set_visible(False)
    annvline_diff.set_visible(False)
    annvline_abs.set_lw(0.5)
    annvline_diff.set_lw(0.5)

    def on_mouse_move(event: Any) -> None:
        if not annvline_abs.get_visible():
            return
        diff_contains, _ = diff_axes.contains(event)
        abs_contains, _ = absolute_axes.contains(event)
        if not (diff_contains or abs_contains):
            return
        annvline_abs.set_data([event.xdata, event.xdata], [0, 1])
        annvline_diff.set_data([event.xdata, event.xdata], [0, 1])
        fig.canvas.draw()

    def on_button(event: Any) -> None:
        diff_contains, _ = diff_axes.contains(event)
        abs_contains, _ = absolute_axes.contains(event)
        if diff_contains or abs_contains:
            annvline_abs.set_visible(not annvline_abs.get_visible())
            annvline_diff.set_visible(not annvline_diff.get_visible())
            fig.canvas.draw()

    fig.canvas.mpl_connect("motion_notify_event", on_mouse_move)
    fig.canvas.mpl_connect("button_press_event", on_button)
    return fig


def plot_position_errors(plots: List[PlotParams]) -> None:
    """Plot more than one axis worth of data. Requires pyplot."""
    import matplotlib.pyplot as pp

    for plot in plots:
        try:
            plot_one(plot)
        except NoRecords:
            pass

    pp.show()


def _motion_nodes(node: NodeId) -> Set[NodeId]:
    if node.application_for() == NodeId.head:
        return {NodeId.head_l, NodeId.head_r}
    if node.application_for() == NodeId.gripper:
        return {NodeId.gripper_g, NodeId.gripper_z}
    return {node}


def _verify_nodes(nodes: Optional[List[str]]) -> Iterator[NodeId]:
    valid_node_strs = [n.name for n in set([id.application_for() for id in NodeId])]
    if not nodes:
        nodes = valid_node_strs
    to_check: Set[NodeId] = set()
    for node in nodes:
        try:
            to_check |= _motion_nodes(NodeId[node])
        except BaseException as e:
            print(repr(e))
            print(
                f'Invalid node name {node}, must be one of: {", ".join(valid_node_strs)}'
            )
            sys.exit(-1)
    for node_element in to_check:
        yield node_element


def _date_from_spec(userstr: str) -> Optional[datetime]:
    if not userstr:
        return None
    if "." in userstr:
        return datetime.strptime(
            userstr.strip().split(".")[0] + "+0000", "%b %d %H:%M:%S%z"
        ) + timedelta(seconds=float("0." + userstr.strip().split(".")[1]))
    else:
        return datetime.strptime(userstr.strip() + "+0000", "%b %d %H:%M:%S%z")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)

    parser.add_argument(
        "operation", metavar="OPERATION", choices=OPERATIONS, help="Operation"
    )
    parser.add_argument(
        "file", metavar="FILE", type=argparse.FileType("r"), help="File to parse"
    )
    parser.add_argument(
        "node",
        metavar="NODE",
        nargs="*",
        type=str,
        help="If specified, show only specified nodes (may specify more than one)",
    )
    parser.add_argument(
        "-s",
        "--since",
        default="",
        type=str,
        help="Datestamp before which logs will not be considered",
    )
    parser.add_argument(
        "-u",
        "--until",
        default="",
        type=str,
        help="Datestamp after which logs will not be considered",
    )
    parser.add_argument(
        "--annotate-errors",
        action="store_true",
        help="Print out big error messages in log processing",
    )
    args = parser.parse_args()
    nodes = set(_verify_nodes(args.node))
    main(
        args.operation,
        args.file,
        nodes,
        _date_from_spec(args.since),
        _date_from_spec(args.until),
        args.annotate_errors,
    )