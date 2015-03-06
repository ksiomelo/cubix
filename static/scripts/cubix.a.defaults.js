// THIS JAVASCRIPT SHOULD BE LOADED BEFORE ALL OTHERS (cubix.x.js)

/*
 * Constants
 */
// context

var SEPARATOR = "-";

// layout
var DEFAULT_WIDTH = 570; //960
var DEFAULT_HEIGHT = 500; // 600

var MAXIMIZED_HEIGHT = 1040;
var MAXIMIZED_WIDTH = 800;

var DEFAULT_ATTR_GRAPH_WIDTH = 500;
var DEFAULT_ATTR_GRAPH_HEIGHT = 600;

// sunburst label strategy (hide labels in arcs with less or equal this angle)
var MIN_ANGLE_FOR_LABELS = 6; // 10


// flag for filtering in the context of visual
var FILTER_CONTEXT = true;

// lattice
var MAX_ENTITY_SIZE = 35; // max numer of attributes or objects


// size
var DEFAULT_NODE_RADIUS = 8;
var NODE_MAX_SIZE = 16;
var NODE_MIN_SIZE = 6;

var DEFAULT_EDGE_THICKNESS = 4;
var EDGE_MAX_THICK = 21;
var EDGE_MIN_THICK = 1;


var SIZE_STABILITY = 2;
var SIZE_SUPPORT = 2;
var SIZE_DEFAULT = 1;

// labels
var LABEL_REPETITIVE = "repetitive";
var LABEL_MULTILABEL = "multi-label";
var displayAttrLabel = true;
var displayObjLabel = false;

var TRUNCATE_AT = 5; // ONLY FIRST FIVE LABELS ARE DISPLAYED

// colors
var SELECTED_FILL_COLOR = "#FF0000";
var DEFAULT_FILL_COLOR = "#aaaaff";
var DEFAULT_OPACITY = 0.3;
