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
  chromeLeftPx: number;
  chromeTopPx: number;
  chromeWidthPx: number;
  chromeHeightPx: number;
  chromeRadiusPx: number;
  chromeOpacity: number;
  heroOpacity: number;
  backdropOpacity: number;
};
