export type HeroZoomMeasurements = {
  viewportHeight: number;
  frameTop: number;
  frameLeft: number;
  frameWidth: number;
  frameHeight: number;
  replicaHeight: number;
  placeholderTop: number;
  placeholderLeft: number;
  placeholderWidth: number;
  placeholderHeight: number;
};

export type HeroZoomFrameStyle = {
  translateX: number;
  translateY: number;
  scale: number;
  clipBottomPx: number;
  clipRadiusPx: number;
  heroOpacity: number;
  backdropOpacity: number;
};
