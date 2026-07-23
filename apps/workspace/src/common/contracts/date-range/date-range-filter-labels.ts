export type DateRangeFilterLabels = {
  group: string;
  preset: string;
  from: string;
  to: string;
  options: {
    today: string;
    last7Days: string;
    last30Days: string;
    last90Days: string;
    all: string;
    custom: string;
  };
};
