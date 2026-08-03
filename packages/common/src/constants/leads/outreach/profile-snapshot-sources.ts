export const ProfileSnapshotSource = {
  BridgeApi: "bridge_api",
  BridgeDom: "bridge_dom",
  ManualPaste: "manual_paste",
} as const;

export type ProfileSnapshotSource =
  (typeof ProfileSnapshotSource)[keyof typeof ProfileSnapshotSource];

export const PROFILE_SNAPSHOT_SOURCE_VALUES = [
  ProfileSnapshotSource.BridgeApi,
  ProfileSnapshotSource.BridgeDom,
  ProfileSnapshotSource.ManualPaste,
] as const;
