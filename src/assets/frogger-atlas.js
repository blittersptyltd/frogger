export const FROGGER_SHEET_URL = "public/images/11067.png";

export const REQUIRED_TUTORIAL_IDS = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 30, 31, 32, 33, 50, 51, 52, 53, 54, 63, 86, 87, 88
];

export const ADVANCED_TUTORIAL_IDS = [
  70, 71, 72, 73, 74, 75, 76, 77, 78
];

export const FROGGER_ATLAS = {
  0: {
    name: "frog_leap_open",
    source: [75, 5, 12, 9],
    size: [16, 16],
    render: [12, 9, 2, 4],
    role: "alive frog frame"
  },
  1: {
    name: "frog_leap_mid",
    source: [93, 2, 12, 13],
    size: [16, 16],
    render: [12, 13, 2, 2],
    role: "alive frog frame"
  },
  2: {
    name: "frog_idle",
    source: [93, 2, 12, 13],
    size: [16, 16],
    render: [12, 13, 2, 2],
    role: "alive frog frame"
  },
  3: {
    name: "yellow_car",
    source: [19, 117, 16, 14],
    size: [16, 16],
    role: "road vehicle"
  },
  4: {
    name: "dozer",
    source: [56, 118, 14, 12],
    size: [16, 16],
    role: "road vehicle"
  },
  5: {
    name: "truck_front",
    source: [76, 119, 14, 10],
    size: [16, 16],
    role: "road vehicle piece"
  },
  6: {
    name: "truck_back",
    source: [90, 119, 13, 10],
    size: [16, 16],
    role: "road vehicle piece"
  },
  7: {
    name: "purple_car",
    source: [2, 119, 15, 10],
    size: [16, 16],
    role: "road vehicle"
  },
  8: {
    name: "race_car",
    source: [37, 117, 16, 14],
    size: [16, 16],
    role: "road vehicle"
  },
  30: {
    name: "frog_death_3",
    source: [57, 39, 13, 12],
    size: [16, 16],
    render: [13, 12, 3, 3],
    role: "death animation frame"
  },
  31: {
    name: "frog_death_0",
    source: [3, 40, 12, 9],
    size: [16, 16],
    render: [12, 9, 3, 4],
    role: "death animation frame"
  },
  32: {
    name: "frog_death_1",
    source: [21, 39, 12, 13],
    size: [16, 16],
    render: [12, 13, 3, 3],
    role: "death animation frame"
  },
  33: {
    name: "frog_death_2",
    source: [40, 39, 9, 12],
    size: [16, 16],
    render: [9, 12, 4, 3],
    role: "death animation frame"
  },
  50: {
    name: "turtle_0",
    source: [2, 156, 13, 9],
    size: [16, 16],
    role: "river support frame"
  },
  51: {
    name: "turtle_1",
    source: [19, 155, 15, 11],
    size: [16, 16],
    role: "river support frame"
  },
  52: {
    name: "turtle_2",
    source: [37, 155, 15, 11],
    size: [16, 16],
    role: "river support frame"
  },
  53: {
    name: "turtle_sink_0",
    source: [55, 152, 16, 16],
    size: [16, 16],
    role: "turtle sinking frame"
  },
  54: {
    name: "turtle_sink_1",
    source: [73, 152, 16, 16],
    size: [16, 16],
    role: "turtle sinking frame"
  },
  63: {
    name: "home_frog",
    source: [93, 2, 12, 13],
    size: [16, 16],
    role: "home frog / filled home marker"
  },
  70: {
    name: "bonus_fly",
    source: [3, 81, 12, 11],
    size: [16, 16],
    render: [12, 12, 2, 2],
    role: "advanced home bonus"
  },
  71: {
    name: "passenger_frog",
    source: [93, 20, 12, 13],
    size: [16, 16],
    render: [12, 13, 2, 2],
    role: "advanced river pickup"
  },
  72: {
    name: "home_crocodile_head_closed",
    source: [136, 134, 18, 16],
    size: [16, 16],
    render: [16, 14, 0, 1],
    role: "advanced home hazard"
  },
  76: {
    name: "home_crocodile_head_open",
    source: [88, 130, 17, 22],
    size: [16, 16],
    render: [14, 16, 1, 0],
    role: "advanced home hazard"
  },
  77: {
    name: "river_crocodile_closed",
    source: [106, 136, 48, 16],
    size: [48, 16],
    render: [48, 16, 0, 0],
    role: "advanced river support"
  },
  78: {
    name: "river_crocodile_open",
    source: [56, 130, 50, 22],
    size: [48, 16],
    render: [48, 16, 0, 0],
    role: "advanced river support"
  },
  73: {
    name: "snake_0",
    source: [3, 172, 30, 11],
    size: [32, 16],
    render: [32, 12, 0, 2],
    role: "advanced moving hazard"
  },
  74: {
    name: "snake_1",
    source: [37, 174, 30, 9],
    size: [32, 16],
    render: [32, 10, 0, 3],
    role: "advanced moving hazard"
  },
  75: {
    name: "snake_2",
    source: [70, 177, 29, 6],
    size: [32, 16],
    render: [32, 8, 0, 4],
    role: "advanced moving hazard"
  },
  86: {
    name: "log_left",
    source: [4, 137, 13, 10],
    size: [16, 16],
    render: [16, 12, 0, 2],
    role: "log piece",
    note: "Trimmed from packed-sheet padding so adjacent log tiles touch."
  },
  87: {
    name: "log_middle",
    source: [19, 137, 16, 10],
    size: [16, 16],
    render: [16, 12, 0, 2],
    role: "log piece",
    note: "Trimmed from packed-sheet padding so adjacent log tiles touch."
  },
  88: {
    name: "log_right",
    source: [37, 137, 13, 10],
    size: [16, 16],
    render: [16, 12, 0, 2],
    role: "log piece",
    note: "Trimmed from packed-sheet padding so adjacent log tiles touch."
  }
};

export const COMPOSITE_PREVIEWS = [
  {
    name: "frog leap sequence",
    ids: [2, 2, 1, 1, 0, 0, 0, 0, 2],
    description: "Tutorial draw order across an 8-tick leap and landing."
  },
  {
    name: "death sequence",
    ids: [31, 32, 33, 30],
    description: "Tutorial death frame order."
  },
  {
    name: "truck",
    ids: [5, 6],
    description: "Road truck drawn from adjacent frames."
  },
  {
    name: "turtle cycle",
    ids: [50, 51, 52, 53, 54, 54, 53, 52],
    description: "Surface and sinking frames from the source sheet."
  },
  {
    name: "log length 2",
    ids: [86, 87, 87, 88],
    description: "log(2): left, two middles, right."
  },
  {
    name: "log length 5",
    ids: [86, 87, 87, 87, 87, 87, 88],
    description: "log(5): long river log."
  },
  {
    name: "river crocodile",
    ids: [77, 78],
    description: "Full-body crocodile frames used as log replacements."
  }
];
