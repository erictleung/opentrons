"""Define the possible names of protocol files to use in testing."""
from typing import Literal

names = Literal[
    "OT2_None_None_2_12_Python310SyntaxRobotAnalysisOnlyError",
    "OT2_None_None_2_13_PythonSyntaxError",
    "OT2_P1000SLeft_None_6_1_SimpleTransfer",
    "OT2_P10S_P300M_TC1_TM_MM_2_11_Swift",
    "OT2_P20S_None_2_7_Walkthrough",
    "OT2_P20S_P300M_HS_6_1_HS_WithCollision_Error",
    "OT2_P20S_P300M_NoMods_6_1_TransferReTransferLiquid",
    "OT2_P20SRight_None_6_1_SimpleTransferError",
    "OT2_P300M_P20S_2_16_aspirateDispenseMix0Volume",
    "OT2_P300M_P20S_HS_6_1_Smoke620release",
    "OT2_P300M_P20S_MM_HS_TD_TC_6_1_AllMods_Error",
    "OT2_P300M_P20S_MM_TM_TC1_5_2_6_PD40",
    "OT2_P300M_P20S_MM_TM_TC1_5_2_6_PD40Error",
    "OT2_P300M_P20S_NoMod_6_1_MixTransferManyLiquids",
    "OT2_P300M_P20S_None_2_12_FailOnRun",
    "OT2_P300M_P20S_TC_HS_TM_2_13_SmokeTestV3",
    "OT2_P300M_P20S_TC_HS_TM_2_14_SmokeTestV3",
    "OT2_P300M_P20S_TC_HS_TM_2_15_SmokeTestV3",
    "OT2_P300M_P20S_TC_HS_TM_2_16_SmokeTestV3",
    "OT2_P300M_P20S_TC_MM_TM_2_13_Smoke620Release",
    "OT2_P300M_P300S_HS_6_1_HS_NormalUseWithTransfer",
    "OT2_P300MLeft_MM_TM_2_4_Zymo",
    "OT2_P300S_Thermocycler_Moam_Error",
    "OT2_P300S_Twinning_Error",
    "OT2_P300SG1_None_5_2_6_Gen1PipetteSimple",
    "OT2_P300SLeft_MM_TM_TM_5_2_6_MOAMTemps",
    "OT2_P300SLeft_MM1_MM_2_2_EngageMagHeightFromBase",
    "OT2_P300SLeft_MM1_MM_TM_2_3_Mix",
    "OT3_None_None_2_16_AnalysisError_AccessToFixedTrashProp",
    "OT3_None_None_2_16_AnalysisError_TrashBinInCol2",
    "OT3_None_None_2_16_AnalysisError_TrashBinInStagingAreaCol3",
    "OT3_None_None_2_16_AnalysisError_TrashBinInStagingAreaCol4",
    "OT3_None_None_MM_2_16_AnalysisError_MagneticModuleInFlexProtocol",
    "OT3_None_None_TM_2_16_AnalysisError_ModuleInStagingAreaCol3",
    "OT3_None_None_TM_2_16_AnalysisError_ModuleInStagingAreaCol4",
    "OT3_None_None_TM_2_16_AnalysisError_ModuleInCol2",
    "OT3_P100_96_HS_TM_2_15_Quick_Zymo_RNA_Bacteria",
    "OT3_P1000_96_2_16_AnalysisError_DropTipsWithNoTrash",
    "OT3_P1000_96_GRIPPER_2_16_AnalysisError_DropLabwareIntoTrashBin",
    "OT3_P1000_96_GRIPPER_HS_TM_TC_MB_2_16_DeckConfiguration1_NoFixtures",
    "OT3_P1000_96_GRIPPER_HS_TM_TC_MB_2_16_DeckConfiguration1_NoModules",
    "OT3_P1000_96_GRIPPER_HS_TM_TC_MB_2_16_DeckConfiguration1_NoModulesNoFixtures",
    "OT3_P1000_96_GRIPPER_HS_TM_TC_MB_2_16_DeckConfiguration1",
    "OT3_P1000_96_GRIPPER_HS_TM_TC_MB_2_16_Smoke",
    "OT3_P1000_96_HS_TM_MM_2_15_ABR5_6_HDQ_Bacteria_ParkTips_96_channel",
    "OT3_P1000_96_HS_TM_MM_2_15_MagMaxRNACells96Ch",
    "OT3_P1000_96_HS_TM_TC_MM_2_15_ABR5_6_Illumina_DNA_Prep_96x_Head_PART_III",
    "OT3_P1000_96_None_2_15_ABR5_6_IDT_xGen_EZ_96x_Head_PART_I_III_ABR",
    "OT3_P1000_96_None_2_16_AnalysisError_TrashBinInStagingAreaCol3",
    "OT3_P1000_96_TM_2_16_AnalysisError_ModuleAndWasteChuteConflict",
    "OT3_P1000MLeft_P50MRight_HS_MM_TC_TM_2_15_ABR3_Illumina_DNA_Enrichment_v4",
    "OT3_P1000MLeft_P50MRight_HS_MM_TC_TM_2_15_ABR3_Illumina_DNA_Enrichment",
    "OT3_P1000MLeft_P50MRight_HS_TM_MM_TC_2_15_ABR4_Illumina_DNA_Prep_24x",
    "OT3_P1000SRight_None_2_15_ABR_Simple_Normalize_Long_Right",
    "OT3_P300Gen2_None_2_16_AnalysisError_OT2PipetteInFlexProtocol",
    "OT3_P50MLeft_P1000MRight_None_2_15_ABRKAPALibraryQuantLongv2",
]
