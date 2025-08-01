/*
 *  Copyright 1998-2025 by Northwoods Software Corporation. All Rights Reserved.
 */
/*
 * This is an extension and not part of the main GoJS library.
 * The source code for this is at extensionsJSM/Figures.ts.
 * Note that the API for this class may change with any version, even point releases.
 * If you intend to use an extension in production, you should copy the code to your own source directory.
 * Extensions can be found in the GoJS kit under the extensions or extensionsJSM folders.
 * See the Extensions intro page (https://gojs.net/latest/intro/extensions.html) for more information.
 */

// This file holds definitions of all legacy shape figures -- string values for Shape.figure.
// The source code for this is at extensionsJSM/Figures.ts.
// They were built into the library in version 1, but most were removed for v2.0.
// The following figures are still built-in to the go.js library and thus do not need explicit definitions:
//   Rectangle, Square, RoundedRectangle, Border, Ellipse, Circle,
//   TriangleRight, TriangleDown, TriangleLeft, TriangleUp, Triangle,
//   LineH, LineV, None, BarH, BarV, MinusLine, PlusLine, XLine, Capsule

/**
 * @hidden @internal
 * This FigureParameter class describes various properties each parameter uses in figures.
 */
class FigureParameter {
    constructor(name, def, min, max) {


        

        if (min === undefined)
            min = 0.0;
        if (max === undefined)
            max = Infinity;
        this._name = name;
        this._defaultValue = def;
        this._minimum = min;
        this._maximum = max;
        // (go.Shape as any)['_FigureParameters'] = {};


        
    }
    /**
     * Gets or sets the name of the figure.
     */
    get name() {
        return this._name;
    }
    set name(val) {
        if (typeof val !== 'string' || val === '')
            throw new Error('Shape name must be a valid string.');
        this._name = val;
    }
    /**
     * Gets or sets the default value for the parameter.
     */
    get defaultValue() {
        return this._defaultValue;
    }
    set defaultValue(val) {
        if (typeof val !== 'number' || isNaN(val))
            throw new Error('The default value must be a real number, not: ' + val);
        this._defaultValue = val;
    }
    /**
     * Gets or sets the minimum value allowed for the figure parameter.
     */
    get minimum() {
        return this._minimum;
    }
    set minimum(val) {
        if (typeof val !== 'number' || isNaN(val))
            throw new Error('Minimum must be a real number, not: ' + val);
        this._minimum = val;
    }
    /**
     * Gets or sets the maximum value allowed for the figure parameter.
     */
    get maximum() {
        return this._maximum;
    }
    set maximum(val) {
        if (typeof val !== 'number' || isNaN(val))
            throw new Error('Maximum must be a real number, not: ' + val);
        this._maximum = val;
    }
    /**
     * This static function gets a FigureParameter for a particular figure name.
     * @param figurename
     * @param index - currently must be either 0 or 1
     */
    static getFigureParameter(figurename, index) {
        // const arr = (go.Shape as any)['_FigureParameters'][figurename];
        const arr = FigureParameter.definedParameters[figurename];
        if (!arr)
            return null;
        return arr[index];
    }
    /**
     * This static function sets a FigureParameter for a particular figure name.
     * @param figurename
     * @param index - currently must be either 0 or 1
     * @param figparam
     */
    static setFigureParameter(figurename, index, figparam) {
        if (!(figparam instanceof FigureParameter))
            throw new Error('Third argument to FigureParameter.setFigureParameter is not FigureParameter: ' + figparam);
        if (figparam.defaultValue < figparam.minimum || figparam.defaultValue > figparam.maximum) {
            throw new Error('defaultValue must be between minimum and maximum, not: ' + figparam.defaultValue);
        }
        // const paramObj = (go.Shape as any)['_FigureParameters'];
        // let arr = paramObj[figurename];
        let arr = FigureParameter.definedParameters[figurename];
        if (!arr) {
            // arr = [];
            // paramObj[figurename] = arr;
            arr = [];
            FigureParameter.definedParameters[figurename] = arr;
        }
        arr[index] = figparam;
    }
}
FigureParameter.definedParameters = {};
const _CachedPoints = [];
/**
 * @param x
 * @param y
 */
function tempPointAt(x, y) {
    const temp = _CachedPoints.pop();
    if (temp === undefined)
        return new go.Point(x, y);
    temp.x = x;
    temp.y = y;
    return temp;
}
function tempPoint() {
    const temp = _CachedPoints.pop();
    if (temp === undefined)
        return new go.Point();
    return temp;
}
/**
 * @param temp
 */
function freePoint(temp) {
    _CachedPoints.push(temp);
}
/**
 * @param p1x
 * @param p1y
 * @param p2x
 * @param p2y
 * @param q1x
 * @param q1y
 * @param q2x
 * @param q2y
 * @param result
 */
function getIntersection(p1x, p1y, p2x, p2y, q1x, q1y, q2x, q2y, result) {
    if (!result)
        result = new go.Point();
    const dx1 = p1x - p2x;
    const dx2 = q1x - q2x;
    let x = NaN;
    let y = NaN;
    if (dx1 === 0) {
        if (dx2 === 0) {
            if (p1x === p2x) {
                x = p1x;
                y = p1y;
            }
        }
        else {
            const m2 = (q1y - q2y) / dx2;
            const b2 = q1y - m2 * q1x;
            x = p1x;
            y = m2 * x + b2;
        }
    }
    else {
        if (dx2 === 0) {
            const m1 = (p1y - p2y) / dx1;
            const b1 = p1y - m1 * p1x;
            x = q1x;
            y = m1 * x + b1;
        }
        else {
            const m1 = (p1y - p2y) / dx1;
            const m2 = (q1y - q2y) / dx2;
            const b1 = p1y - m1 * p1x;
            const b2 = q1y - m2 * q1x;
            x = (b2 - b1) / (m1 - m2);
            y = m1 * x + b1;
        }
    }
    result.x = x;
    result.y = y;
    return result;
}
/**
 * @param startx
 * @param starty
 * @param c1x
 * @param c1y
 * @param c2x
 * @param c2y
 * @param endx
 * @param endy
 * @param fraction
 * @param curve1cp1  // modified result control point
 * @param curve1cp2  // modified result control point
 * @param midpoint  // modified result
 * @param curve2cp1  // modified result control point
 * @param curve2cp2  // modified result control point
 */
function breakUpBezier(startx, starty, c1x, c1y, c2x, c2y, endx, endy, fraction, curve1cp1, curve1cp2, midpoint, curve2cp1, curve2cp2) {
    const fo = 1 - fraction;
    const so = fraction;
    const m1x = startx * fo + c1x * so;
    const m1y = starty * fo + c1y * so;
    const m2x = c1x * fo + c2x * so;
    const m2y = c1y * fo + c2y * so;
    const m3x = c2x * fo + endx * so;
    const m3y = c2y * fo + endy * so;
    const m12x = m1x * fo + m2x * so;
    const m12y = m1y * fo + m2y * so;
    const m23x = m2x * fo + m3x * so;
    const m23y = m2y * fo + m3y * so;
    const m123x = m12x * fo + m23x * so;
    const m123y = m12y * fo + m23y * so;
    curve1cp1.x = m1x;
    curve1cp1.y = m1y;
    curve1cp2.x = m12x;
    curve1cp2.y = m12y;
    midpoint.x = m123x;
    midpoint.y = m123y;
    curve2cp1.x = m23x;
    curve2cp1.y = m23y;
    curve2cp2.x = m3x;
    curve2cp2.y = m3y;
}
const GeneratorEllipseSpot1 = new go.Spot(0.156, 0.156);
const GeneratorEllipseSpot2 = new go.Spot(0.844, 0.844);
const KAPPA = 4 * ((Math.sqrt(2) - 1) / 3);
// OPTIONAL figures, not predefined in the v3.0 library:
// ChamferedRectangle
// parameter1 controls the length of the side of the triangle that is cut off from a corner.
//   The corner is always cut at 45 degrees.  If the width or height is not large enough,
//   the length of the side of the triangle is limited to half of the width or height.
// parameter2 is a bit mask controlling which corners are cut off:
//   1: top-left
//   2: top-right
//   4: bottom-right
//   8: bottom-left
go.Shape.defineFigureGenerator('ChamferedRectangle', (shape, w, h) => {
    let param1 = shape ? shape.parameter1 : NaN; // how much to cut off from the corner, both X and Y
    if (isNaN(param1) || param1 < 0)
        param1 = 12;
    let param2 = shape ? shape.parameter2 : NaN; // which corners to cut off
    if (isNaN(param2))
        param2 = 1 | 2 | 4 | 8; // default: all corners
    let p0 = param1; // limit top-left corner
    if (param2 & 1) {
        p0 = Math.min(p0, (param2 & 2) === 2 ? w / 2 : w);
        p0 = Math.min(p0, (param2 & 8) === 8 ? h / 2 : h);
    }
    else {
        p0 = 0;
    }
    const fig = new go.PathFigure(p0, 0, true);
    const geo = new go.Geometry().add(fig);
    const spot1 = go.Spot.TopLeft.copy();
    const spot2 = go.Spot.BottomRight.copy();
    if ((param2 & 2) === 2) {
        // top right
        let p1 = param1;
        p1 = Math.min(p1, (param2 & 1) === 1 ? w / 2 : w);
        p1 = Math.min(p1, (param2 & 4) === 4 ? h / 2 : h);
        fig
            .add(new go.PathSegment(go.SegmentType.Line, w - p1, 0))
            .add(new go.PathSegment(go.SegmentType.Line, w, p1));
        spot1.offsetY = p1 / 2;
        spot2.offsetX = -p1 / 2;
    }
    else {
        fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
    }
    if (param2 & 4) {
        // bottom right
        let p1 = param1;
        p1 = Math.min(p1, (param2 & 8) === 8 ? w / 2 : w);
        p1 = Math.min(p1, (param2 & 2) === 2 ? h / 2 : h);
        fig
            .add(new go.PathSegment(go.SegmentType.Line, w, h - p1))
            .add(new go.PathSegment(go.SegmentType.Line, w - p1, h));
        spot2.offsetX = -p1 / 2;
        spot2.offsetY = -p1 / 2;
    }
    else {
        fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
    }
    if (param2 & 8) {
        // bottom left
        let p1 = param1;
        p1 = Math.min(p1, (param2 & 4) === 4 ? w / 2 : w);
        p1 = Math.min(p1, (param2 & 1) === 1 ? h / 2 : h);
        fig
            .add(new go.PathSegment(go.SegmentType.Line, p1, h))
            .add(new go.PathSegment(go.SegmentType.Line, 0, h - p1));
        spot1.offsetX = p1 / 2;
        spot2.offsetY = -p1 / 2;
    }
    else {
        fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
    }
    if (param2 & 1) {
        // top left
        fig.add(new go.PathSegment(go.SegmentType.Line, 0, p0).close());
        spot1.offsetX = p0 / 2;
        spot1.offsetY = p0 / 2;
    }
    else {
        fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0).close());
    }
    geo.spot1 = spot1;
    geo.spot2 = spot2;
    return geo;
});
// narrow ends of rectangular area come to a point
go.Shape.defineFigureGenerator('HexagonalCapsule', (shape, w, h) => {
    let param1 = shape ? shape.parameter1 : NaN;
    if (isNaN(param1))
        param1 = 10;
    const geo = new go.Geometry();
    if (w < h) {
        const inset = Math.min(param1, w / 2);
        const fig = new go.PathFigure(w / 2, 0, true);
        geo.add(fig);
        // Outline
        fig.add(new go.PathSegment(go.SegmentType.Line, w, inset));
        fig.add(new go.PathSegment(go.SegmentType.Line, w, h - inset));
        fig.add(new go.PathSegment(go.SegmentType.Line, w / 2, h));
        fig.add(new go.PathSegment(go.SegmentType.Line, 0, h - inset));
        fig.add(new go.PathSegment(go.SegmentType.Line, 0, inset).close());
        geo.spot1 = new go.Spot(0, 0, inset / 2, inset);
        geo.spot2 = new go.Spot(1, 1, -inset / 2, -inset);
    }
    else {
        const inset = Math.min(param1, h / 2);
        const fig = new go.PathFigure(inset, 0, true);
        geo.add(fig);
        // Outline
        fig.add(new go.PathSegment(go.SegmentType.Line, w - inset, 0));
        fig.add(new go.PathSegment(go.SegmentType.Line, w, h / 2));
        fig.add(new go.PathSegment(go.SegmentType.Line, w - inset, h));
        fig.add(new go.PathSegment(go.SegmentType.Line, inset, h));
        fig.add(new go.PathSegment(go.SegmentType.Line, 0, h / 2).close());
        geo.spot1 = new go.Spot(0, 0, inset, inset / 2);
        geo.spot2 = new go.Spot(1, 1, -inset, -inset / 2);
    }
    return geo;
});
go.Shape.defineFigureGenerator('AsteriskLine', (shape, w, h) => {
    const offset = 0.2 / Math.SQRT2;
    return new go.Geometry().add(new go.PathFigure(offset * w, (1 - offset) * h, false)
        .add(new go.PathSegment(go.SegmentType.Line, (1 - offset) * w, offset * h))
        .add(new go.PathSegment(go.SegmentType.Move, offset * w, offset * h))
        .add(new go.PathSegment(go.SegmentType.Line, (1 - offset) * w, (1 - offset) * h))
        .add(new go.PathSegment(go.SegmentType.Move, 0, h / 2))
        .add(new go.PathSegment(go.SegmentType.Line, w, h / 2))
        .add(new go.PathSegment(go.SegmentType.Move, w / 2, 0))
        .add(new go.PathSegment(go.SegmentType.Line, w / 2, h)));
});
go.Shape.defineFigureGenerator('CircleLine', (shape, w, h) => {
    const rad = w / 2;
    const geo = new go.Geometry().add(new go.PathFigure(w, w / 2, false) // clockwise
        .add(new go.PathSegment(go.SegmentType.Arc, 0, 360, rad, rad, rad, rad).close()));
    geo.spot1 = GeneratorEllipseSpot1;
    geo.spot2 = GeneratorEllipseSpot2;
    geo.defaultStretch = go.GeometryStretch.Uniform;
    return geo;
});
go.Shape.defineFigureGenerator('Line1', (shape, w, h) => {
    const geo = new go.Geometry(go.GeometryType.Line);
    geo.startX = 0;
    geo.startY = 0;
    geo.endX = w;
    geo.endY = h;
    return geo;
});
go.Shape.defineFigureGenerator('Line2', (shape, w, h) => {
    const geo = new go.Geometry(go.GeometryType.Line);
    geo.startX = w;
    geo.startY = 0;
    geo.endX = 0;
    geo.endY = h;
    return geo;
});
go.Shape.defineFigureGenerator('Curve1', (shape, w, h) => new go.Geometry().add(new go.PathFigure(0, 0, false).add(new go.PathSegment(go.SegmentType.Bezier, w, h, KAPPA * w, 0, w, (1 - KAPPA) * h))));
go.Shape.defineFigureGenerator('Curve2', (shape, w, h) => new go.Geometry().add(new go.PathFigure(0, 0, false).add(new go.PathSegment(go.SegmentType.Bezier, w, h, 0, KAPPA * h, (1 - KAPPA) * w, h))));
go.Shape.defineFigureGenerator('Curve3', (shape, w, h) => new go.Geometry().add(new go.PathFigure(w, 0, false).add(new go.PathSegment(go.SegmentType.Bezier, 0, h, w, KAPPA * h, KAPPA * w, h))));
go.Shape.defineFigureGenerator('Curve4', (shape, w, h) => new go.Geometry().add(new go.PathFigure(w, 0, false).add(new go.PathSegment(go.SegmentType.Bezier, 0, h, (1 - KAPPA) * w, 0, 0, (1 - KAPPA) * h))));
go.Shape.defineFigureGenerator('TriangleDownLeft', (shape, w, h) => new go.Geometry()
    .add(new go.PathFigure(0, 0, true)
    .add(new go.PathSegment(go.SegmentType.Line, w, h))
    .add(new go.PathSegment(go.SegmentType.Line, 0, h).close()))
    .setSpots(0, 0.5, 0.5, 1));
go.Shape.defineFigureGenerator('TriangleDownRight', (shape, w, h) => new go.Geometry()
    .add(new go.PathFigure(w, 0, true)
    .add(new go.PathSegment(go.SegmentType.Line, w, h))
    .add(new go.PathSegment(go.SegmentType.Line, 0, h).close()))
    .setSpots(0.5, 0.5, 1, 1));
go.Shape.defineFigureGenerator('TriangleUpLeft', (shape, w, h) => new go.Geometry()
    .add(new go.PathFigure(0, 0, true)
    .add(new go.PathSegment(go.SegmentType.Line, w, 0))
    .add(new go.PathSegment(go.SegmentType.Line, 0, h).close()))
    .setSpots(0, 0, 0.5, 0.5));
go.Shape.defineFigureGenerator('TriangleUpRight', (shape, w, h) => new go.Geometry()
    .add(new go.PathFigure(0, 0, true)
    .add(new go.PathSegment(go.SegmentType.Line, w, 0))
    .add(new go.PathSegment(go.SegmentType.Line, w, h).close()))
    .setSpots(0.5, 0, 1, 0.5));
go.Shape.defineFigureGenerator('RightTriangle', 'TriangleDownLeft');
FigureParameter.setFigureParameter('Parallelogram1', 0, new FigureParameter('Indent', 0.1, -0.99, 0.99));
// go.Shape.defineFigureGenerator('Parallelogram1', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN; // indent's percent distance
//     if (isNaN(param1))
//         param1 = 0.1;
//     else if (param1 < -1)
//         param1 = -1;
//     else if (param1 > 1)
//         param1 = 1;
//     const indent = Math.abs(param1) * w;
//     if (param1 === 0) {
//         const geo = new go.Geometry(go.GeometryType.Rectangle);
//         geo.startX = 0;
//         geo.startY = 0;
//         geo.endX = w;
//         geo.endY = h;
//         return geo;
//     }
//     else {
//         const geo = new go.Geometry();
//         if (param1 > 0) {
//             geo.add(new go.PathFigure(indent, 0)
//                 .add(new go.PathSegment(go.SegmentType.Line, w, 0))
//                 .add(new go.PathSegment(go.SegmentType.Line, w - indent, h))
//                 .add(new go.PathSegment(go.SegmentType.Line, 0, h).close()));
//         }
//         else {
//             // param1 < 0
//             geo.add(new go.PathFigure(0, 0)
//                 .add(new go.PathSegment(go.SegmentType.Line, w - indent, 0))
//                 .add(new go.PathSegment(go.SegmentType.Line, w, h))
//                 .add(new go.PathSegment(go.SegmentType.Line, indent, h).close()));
//         }
//         if (indent < w / 2) {
//             geo.setSpots(indent / w, 0, (w - indent) / w, 1);
//         }
//         return geo;
//     }
// });
// go.Shape.defineFigureGenerator('Parallelogram', 'Parallelogram1'); // alias
// // Parallelogram with absolutes instead of scaling
// FigureParameter.setFigureParameter('Parallelogram2', 0, new FigureParameter('Indent', 10, -Infinity, Infinity));
// go.Shape.defineFigureGenerator('Parallelogram2', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN; // indent's x distance
//     if (isNaN(param1))
//         param1 = 10;
//     else if (param1 < -1)
//         param1 = -w;
//     else if (param1 > 1)
//         param1 = w;
//     const indent = Math.abs(param1);
//     if (param1 === 0) {
//         const geo = new go.Geometry(go.GeometryType.Rectangle);
//         geo.startX = 0;
//         geo.startY = 0;
//         geo.endX = w;
//         geo.endY = h;
//         return geo;
//     }
//     else {
//         const geo = new go.Geometry();
//         if (param1 > 0) {
//             geo.add(new go.PathFigure(indent, 0)
//                 .add(new go.PathSegment(go.SegmentType.Line, w, 0))
//                 .add(new go.PathSegment(go.SegmentType.Line, w - indent, h))
//                 .add(new go.PathSegment(go.SegmentType.Line, 0, h).close()));
//         }
//         else {
//             // param1 < 0
//             geo.add(new go.PathFigure(0, 0)
//                 .add(new go.PathSegment(go.SegmentType.Line, w - indent, 0))
//                 .add(new go.PathSegment(go.SegmentType.Line, w, h))
//                 .add(new go.PathSegment(go.SegmentType.Line, indent, h).close()));
//         }
//         if (indent < w / 2) {
//             geo.setSpots(indent / w, 0, (w - indent) / w, 1);
//         }
//         return geo;
//     }
// });
// FigureParameter.setFigureParameter('Trapezoid1', 0, new FigureParameter('Indent', 0.2, -0.99, 0.99));
// go.Shape.defineFigureGenerator('Trapezoid1', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN; // indent's percent distance
//     if (isNaN(param1))
//         param1 = 0.2;
//     else if (param1 < 0.5)
//         param1 = -0.5;
//     else if (param1 > 0.5)
//         param1 = 0.5;
//     const indent = Math.abs(param1) * w;
//     if (param1 === 0) {
//         const geo = new go.Geometry(go.GeometryType.Rectangle);
//         geo.startX = 0;
//         geo.startY = 0;
//         geo.endX = w;
//         geo.endY = h;
//         return geo;
//     }
//     else {
//         const geo = new go.Geometry();
//         if (param1 > 0) {
//             geo.add(new go.PathFigure(indent, 0)
//                 .add(new go.PathSegment(go.SegmentType.Line, w - indent, 0))
//                 .add(new go.PathSegment(go.SegmentType.Line, w, h))
//                 .add(new go.PathSegment(go.SegmentType.Line, 0, h).close()));
//         }
//         else {
//             // param1 < 0
//             geo.add(new go.PathFigure(0, 0)
//                 .add(new go.PathSegment(go.SegmentType.Line, w, 0))
//                 .add(new go.PathSegment(go.SegmentType.Line, w - indent, h))
//                 .add(new go.PathSegment(go.SegmentType.Line, indent, h).close()));
//         }
//         if (indent < w / 2) {
//             geo.setSpots(indent / w, 0, (w - indent) / w, 1);
//         }
//         return geo;
//     }
// });
// go.Shape.defineFigureGenerator('Trapezoid', 'Trapezoid1'); // alias
// Trapezoid with absolutes instead of scaling
// FigureParameter.setFigureParameter('Trapezoid2', 0, new FigureParameter('Indent', 20, -Infinity, Infinity));
// go.Shape.defineFigureGenerator('Trapezoid2', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN; // indent's x distance
//     if (isNaN(param1))
//         param1 = 20; // default value
//     else if (param1 < -w)
//         param1 = -w / 2;
//     else if (param1 > w)
//         param1 = w / 2;
//     const indent = Math.abs(param1);
//     if (param1 === 0) {
//         const geo = new go.Geometry(go.GeometryType.Rectangle);
//         geo.startX = 0;
//         geo.startY = 0;
//         geo.endX = w;
//         geo.endY = h;
//         return geo;
//     }
//     else {
//         const geo = new go.Geometry();
//         if (param1 > 0) {
//             geo.add(new go.PathFigure(indent, 0)
//                 .add(new go.PathSegment(go.SegmentType.Line, w - indent, 0))
//                 .add(new go.PathSegment(go.SegmentType.Line, w, h))
//                 .add(new go.PathSegment(go.SegmentType.Line, 0, h).close()));
//         }
//         else {
//             // param1 < 0
//             geo.add(new go.PathFigure(0, 0)
//                 .add(new go.PathSegment(go.SegmentType.Line, w, 0))
//                 .add(new go.PathSegment(go.SegmentType.Line, w - indent, h))
//                 .add(new go.PathSegment(go.SegmentType.Line, indent, h).close()));
//         }
//         if (indent < w / 2) {
//             geo.setSpots(indent / w, 0, (w - indent) / w, 1);
//         }
//         return geo;
//     }
// });
// FigureParameter.setFigureParameter('ManualOperation', 0, new FigureParameter('Indent', 10, -Infinity, Infinity));
// go.Shape.defineFigureGenerator('ManualOperation', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN;
//     // Distance from topleft of bounding rectangle,
//     // in % of the total width, of the topleft corner
//     if (isNaN(param1))
//         param1 = 10; // default value
//     else if (param1 < -w)
//         param1 = -w / 2;
//     else if (param1 > w)
//         param1 = w / 2;
//     const indent = Math.abs(param1);
//     if (param1 === 0) {
//         const geo = new go.Geometry(go.GeometryType.Rectangle);
//         geo.startX = 0;
//         geo.startY = 0;
//         geo.endX = w;
//         geo.endY = h;
//         return geo;
//     }
//     else {
//         const geo = new go.Geometry();
//         if (param1 > 0) {
//             geo.add(new go.PathFigure(0, 0)
//                 .add(new go.PathSegment(go.SegmentType.Line, w, 0))
//                 .add(new go.PathSegment(go.SegmentType.Line, w - indent, h))
//                 .add(new go.PathSegment(go.SegmentType.Line, indent, h).close()));
//         }
//         else {
//             // param1 < 0
//             geo.add(new go.PathFigure(indent, 0)
//                 .add(new go.PathSegment(go.SegmentType.Line, w - indent, 0))
//                 .add(new go.PathSegment(go.SegmentType.Line, w, h))
//                 .add(new go.PathSegment(go.SegmentType.Line, 0, h).close()));
//         }
//         if (indent < w / 2) {
//             geo.setSpots(indent / w, 0, (w - indent) / w, 1);
//         }
//         return geo;
//     }
// });
// The following functions are used by a group of regular figures that are defined below:
const _CachedArrays = [];
function tempArray() {
    const temp = _CachedArrays.pop();
    if (temp === undefined)
        return [];
    return temp;
}
/**
 * @param a
 */
function freeArray(a) {
    a.length = 0; // clear any references to objects
    _CachedArrays.push(a);
}
/**
 * @param sides
 */
function createPolygon(sides) {
    // Point[] points = new Point[sides + 1];
    const points = [];
    const radius = 0.5;
    const center = 0.5;
    const offsetAngle = Math.PI * 1.5;
    let angle = 0;
    // Loop through each side of the polygon
    for (let i = 0; i < sides; i++) {
        angle = ((2 * Math.PI) / sides) * i + offsetAngle;
        points[i] = new go.Point(center + radius * Math.cos(angle), center + radius * Math.sin(angle));
    }
    // Add the last line
    // points[points.length - 1] = points[0];
    points.push(points[0]);
    return points;
}
/**
 * This allocates a temporary Array that should be freeArray()'ed by the caller.
 * @param points
 */
function createBurst(points) {
    const star = createStar(points);
    const pts = tempArray(); // new Point[points * 3 + 1];
    pts[0] = star[0];
    for (let i = 1, count = 1; i < star.length; i += 2, count += 3) {
        pts[count] = star[i];
        pts[count + 1] = star[i];
        pts[count + 2] = star[i + 1];
    }
    freeArray(star);
    return pts;
}
/**
 * This allocates a temporary Array that should be freeArray()'ed by the caller.
 * @param points
 */
function createStar(points) {
    // First, create a regular polygon
    const polygon = createPolygon(points);
    // Calculate the points inbetween
    const pts = tempArray(); // new Point[points * 2 + 1];
    const half = Math.floor(polygon.length / 2);
    const count = polygon.length - 1;
    const offset = points % 2 === 0 ? 2 : 1;
    for (let i = 0; i < count; i++) {
        // Get the intersection of two lines
        const p0 = polygon[i];
        const p1 = polygon[i + 1];
        const q21 = polygon[(half + i - 1) % count];
        const q2off = polygon[(half + i + offset) % count];
        pts[i * 2] = p0;
        pts[i * 2 + 1] = getIntersection(p0.x, p0.y, q21.x, q21.y, p1.x, p1.y, q2off.x, q2off.y, new go.Point()); // ?? not currently managed
    }
    pts[pts.length] = pts[0];
    freeArray(polygon);
    return pts;
}
go.Shape.defineFigureGenerator('Pentagon', (shape, w, h) => {
    const points = createPolygon(5);
    const geo = new go.Geometry();
    const fig = new go.PathFigure(points[0].x * w, points[0].y * h, true);
    geo.add(fig);
    for (let i = 1; i < 5; i++) {
        fig.add(new go.PathSegment(go.SegmentType.Line, points[i].x * w, points[i].y * h));
    }
    fig.add(new go.PathSegment(go.SegmentType.Line, points[0].x * w, points[0].y * h).close());
    freeArray(points);
    geo.spot1 = new go.Spot(0.2, 0.22);
    geo.spot2 = new go.Spot(0.8, 0.9);
    return geo;
});
go.Shape.defineFigureGenerator('Hexagon', (shape, w, h) => {
    const points = createPolygon(6);
    const geo = new go.Geometry();
    const fig = new go.PathFigure(points[0].x * w, points[0].y * h, true);
    geo.add(fig);
    for (let i = 1; i < 6; i++) {
        fig.add(new go.PathSegment(go.SegmentType.Line, points[i].x * w, points[i].y * h));
    }
    fig.add(new go.PathSegment(go.SegmentType.Line, points[0].x * w, points[0].y * h).close());
    freeArray(points);
    geo.spot1 = new go.Spot(0.07, 0.25);
    geo.spot2 = new go.Spot(0.93, 0.75);
    return geo;
});
go.Shape.defineFigureGenerator('Heptagon', (shape, w, h) => {
    const points = createPolygon(7);
    const geo = new go.Geometry();
    const fig = new go.PathFigure(points[0].x * w, points[0].y * h, true);
    geo.add(fig);
    for (let i = 1; i < 7; i++) {
        fig.add(new go.PathSegment(go.SegmentType.Line, points[i].x * w, points[i].y * h));
    }
    fig.add(new go.PathSegment(go.SegmentType.Line, points[0].x * w, points[0].y * h).close());
    freeArray(points);
    geo.spot1 = new go.Spot(0.2, 0.15);
    geo.spot2 = new go.Spot(0.8, 0.85);
    return geo;
});
go.Shape.defineFigureGenerator('Octagon', (shape, w, h) => {
    const points = createPolygon(8);
    const geo = new go.Geometry();
    const fig = new go.PathFigure(points[0].x * w, points[0].y * h, true);
    geo.add(fig);
    for (let i = 1; i < 8; i++) {
        fig.add(new go.PathSegment(go.SegmentType.Line, points[i].x * w, points[i].y * h));
    }
    fig.add(new go.PathSegment(go.SegmentType.Line, points[0].x * w, points[0].y * h).close());
    freeArray(points);
    geo.spot1 = new go.Spot(0.15, 0.15);
    geo.spot2 = new go.Spot(0.85, 0.85);
    return geo;
});
go.Shape.defineFigureGenerator('Nonagon', (shape, w, h) => {
    const points = createPolygon(9);
    const geo = new go.Geometry();
    const fig = new go.PathFigure(points[0].x * w, points[0].y * h, true);
    geo.add(fig);
    for (let i = 1; i < 9; i++) {
        fig.add(new go.PathSegment(go.SegmentType.Line, points[i].x * w, points[i].y * h));
    }
    fig.add(new go.PathSegment(go.SegmentType.Line, points[0].x * w, points[0].y * h).close());
    freeArray(points);
    geo.spot1 = new go.Spot(0.17, 0.13);
    geo.spot2 = new go.Spot(0.82, 0.82);
    return geo;
});
go.Shape.defineFigureGenerator('Decagon', (shape, w, h) => {
    const points = createPolygon(10);
    const geo = new go.Geometry();
    const fig = new go.PathFigure(points[0].x * w, points[0].y * h, true);
    geo.add(fig);
    for (let i = 1; i < 10; i++) {
        fig.add(new go.PathSegment(go.SegmentType.Line, points[i].x * w, points[i].y * h));
    }
    fig.add(new go.PathSegment(go.SegmentType.Line, points[0].x * w, points[0].y * h).close());
    freeArray(points);
    geo.spot1 = new go.Spot(0.16, 0.16);
    geo.spot2 = new go.Spot(0.84, 0.84);
    return geo;
});
go.Shape.defineFigureGenerator('Dodecagon', (shape, w, h) => {
    const points = createPolygon(12);
    const geo = new go.Geometry();
    const fig = new go.PathFigure(points[0].x * w, points[0].y * h, true);
    geo.add(fig);
    for (let i = 1; i < 12; i++) {
        fig.add(new go.PathSegment(go.SegmentType.Line, points[i].x * w, points[i].y * h));
    }
    fig.add(new go.PathSegment(go.SegmentType.Line, points[0].x * w, points[0].y * h).close());
    freeArray(points);
    geo.spot1 = new go.Spot(0.16, 0.16);
    geo.spot2 = new go.Spot(0.84, 0.84);
    return geo;
});
// go.Shape.defineFigureGenerator('FivePointedStar', (shape, w, h) => {
//     const starPoints = createStar(5);
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(starPoints[0].x * w, starPoints[0].y * h, true);
//     geo.add(fig);
//     for (let i = 1; i < 10; i++) {
//         fig.add(new go.PathSegment(go.SegmentType.Line, starPoints[i].x * w, starPoints[i].y * h));
//     }
//     fig.add(new go.PathSegment(go.SegmentType.Line, starPoints[0].x * w, starPoints[0].y * h).close());
//     freeArray(starPoints);
//     geo.spot1 = new go.Spot(0.266, 0.333);
//     geo.spot2 = new go.Spot(0.733, 0.733);
//     return geo;
// });
go.Shape.defineFigureGenerator('SixPointedStar', (shape, w, h) => {
    const starPoints = createStar(6);
    const geo = new go.Geometry();
    const fig = new go.PathFigure(starPoints[0].x * w, starPoints[0].y * h, true);
    geo.add(fig);
    for (let i = 1; i < 12; i++) {
        fig.add(new go.PathSegment(go.SegmentType.Line, starPoints[i].x * w, starPoints[i].y * h));
    }
    fig.add(new go.PathSegment(go.SegmentType.Line, starPoints[0].x * w, starPoints[0].y * h).close());
    freeArray(starPoints);
    geo.spot1 = new go.Spot(0.17, 0.25);
    geo.spot2 = new go.Spot(0.83, 0.75);
    return geo;
});
// go.Shape.defineFigureGenerator('SevenPointedStar', (shape, w, h) => {
//     const starPoints = createStar(7);
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(starPoints[0].x * w, starPoints[0].y * h, true);
//     geo.add(fig);
//     for (let i = 1; i < 14; i++) {
//         fig.add(new go.PathSegment(go.SegmentType.Line, starPoints[i].x * w, starPoints[i].y * h));
//     }
//     fig.add(new go.PathSegment(go.SegmentType.Line, starPoints[0].x * w, starPoints[0].y * h).close());
//     freeArray(starPoints);
//     geo.spot1 = new go.Spot(0.222, 0.277);
//     geo.spot2 = new go.Spot(0.777, 0.666);
//     return geo;
// });
// go.Shape.defineFigureGenerator('EightPointedStar', (shape, w, h) => {
//     const starPoints = createStar(8);
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(starPoints[0].x * w, starPoints[0].y * h, true);
//     geo.add(fig);
//     for (let i = 1; i < 16; i++) {
//         fig.add(new go.PathSegment(go.SegmentType.Line, starPoints[i].x * w, starPoints[i].y * h));
//     }
//     fig.add(new go.PathSegment(go.SegmentType.Line, starPoints[0].x * w, starPoints[0].y * h).close());
//     freeArray(starPoints);
//     geo.spot1 = new go.Spot(0.25, 0.25);
//     geo.spot2 = new go.Spot(0.75, 0.75);
//     return geo;
// });
// go.Shape.defineFigureGenerator('NinePointedStar', (shape, w, h) => {
//     const starPoints = createStar(9);
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(starPoints[0].x * w, starPoints[0].y * h, true);
//     geo.add(fig);
//     for (let i = 1; i < 18; i++) {
//         fig.add(new go.PathSegment(go.SegmentType.Line, starPoints[i].x * w, starPoints[i].y * h));
//     }
//     fig.add(new go.PathSegment(go.SegmentType.Line, starPoints[0].x * w, starPoints[0].y * h).close());
//     freeArray(starPoints);
//     geo.spot1 = new go.Spot(0.222, 0.277);
//     geo.spot2 = new go.Spot(0.777, 0.666);
//     return geo;
// });
// go.Shape.defineFigureGenerator('TenPointedStar', (shape, w, h) => {
//     const starPoints = createStar(10);
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(starPoints[0].x * w, starPoints[0].y * h, true);
//     geo.add(fig);
//     for (let i = 1; i < 20; i++) {
//         fig.add(new go.PathSegment(go.SegmentType.Line, starPoints[i].x * w, starPoints[i].y * h));
//     }
//     fig.add(new go.PathSegment(go.SegmentType.Line, starPoints[0].x * w, starPoints[0].y * h).close());
//     freeArray(starPoints);
//     geo.spot1 = new go.Spot(0.281, 0.261);
//     geo.spot2 = new go.Spot(0.723, 0.748);
//     return geo;
// });
// go.Shape.defineFigureGenerator('FivePointedBurst', (shape, w, h) => {
//     const burstPoints = createBurst(5);
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(burstPoints[0].x * w, burstPoints[0].y * h, true);
//     geo.add(fig);
//     for (let i = 1; i < burstPoints.length; i += 3) {
//         fig.add(new go.PathSegment(go.SegmentType.Bezier, burstPoints[i + 2].x * w, burstPoints[i + 2].y * h, burstPoints[i].x * w, burstPoints[i].y * h, burstPoints[i + 1].x * w, burstPoints[i + 1].y * h));
//     }
//     const lst = fig.segments.last();
//     if (lst !== null)
//         lst.close();
//     freeArray(burstPoints);
//     geo.spot1 = new go.Spot(0.222, 0.277);
//     geo.spot2 = new go.Spot(0.777, 0.777);
//     return geo;
// });
// go.Shape.defineFigureGenerator('SixPointedBurst', (shape, w, h) => {
//     const burstPoints = createBurst(6);
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(burstPoints[0].x * w, burstPoints[0].y * h, true);
//     geo.add(fig);
//     for (let i = 1; i < burstPoints.length; i += 3) {
//         fig.add(new go.PathSegment(go.SegmentType.Bezier, burstPoints[i + 2].x * w, burstPoints[i + 2].y * h, burstPoints[i].x * w, burstPoints[i].y * h, burstPoints[i + 1].x * w, burstPoints[i + 1].y * h));
//     }
//     const lst = fig.segments.last();
//     if (lst !== null)
//         lst.close();
//     freeArray(burstPoints);
//     geo.spot1 = new go.Spot(0.17, 0.222);
//     geo.spot2 = new go.Spot(0.833, 0.777);
//     return geo;
// });
// go.Shape.defineFigureGenerator('SevenPointedBurst', (shape, w, h) => {
//     const burstPoints = createBurst(7);
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(burstPoints[0].x * w, burstPoints[0].y * h, true);
//     geo.add(fig);
//     for (let i = 1; i < burstPoints.length; i += 3) {
//         fig.add(new go.PathSegment(go.SegmentType.Bezier, burstPoints[i + 2].x * w, burstPoints[i + 2].y * h, burstPoints[i].x * w, burstPoints[i].y * h, burstPoints[i + 1].x * w, burstPoints[i + 1].y * h));
//     }
//     const lst = fig.segments.last();
//     if (lst !== null)
//         lst.close();
//     freeArray(burstPoints);
//     geo.spot1 = new go.Spot(0.222, 0.222);
//     geo.spot2 = new go.Spot(0.777, 0.777);
//     return geo;
// });
// go.Shape.defineFigureGenerator('EightPointedBurst', (shape, w, h) => {
//     const burstPoints = createBurst(8);
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(burstPoints[0].x * w, burstPoints[0].y * h, true);
//     geo.add(fig);
//     for (let i = 1; i < burstPoints.length; i += 3) {
//         fig.add(new go.PathSegment(go.SegmentType.Bezier, burstPoints[i + 2].x * w, burstPoints[i + 2].y * h, burstPoints[i].x * w, burstPoints[i].y * h, burstPoints[i + 1].x * w, burstPoints[i + 1].y * h));
//     }
//     const lst = fig.segments.last();
//     if (lst !== null)
//         lst.close();
//     freeArray(burstPoints);
//     geo.spot1 = new go.Spot(0.222, 0.222);
//     geo.spot2 = new go.Spot(0.777, 0.777);
//     return geo;
// });
// go.Shape.defineFigureGenerator('NinePointedBurst', (shape, w, h) => {
//     const burstPoints = createBurst(9);
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(burstPoints[0].x * w, burstPoints[0].y * h, true);
//     geo.add(fig);
//     for (let i = 1; i < burstPoints.length; i += 3) {
//         fig.add(new go.PathSegment(go.SegmentType.Bezier, burstPoints[i + 2].x * w, burstPoints[i + 2].y * h, burstPoints[i].x * w, burstPoints[i].y * h, burstPoints[i + 1].x * w, burstPoints[i + 1].y * h));
//     }
//     const lst = fig.segments.last();
//     if (lst !== null)
//         lst.close();
//     freeArray(burstPoints);
//     geo.spot1 = new go.Spot(0.222, 0.222);
//     geo.spot2 = new go.Spot(0.777, 0.777);
//     return geo;
// });
// go.Shape.defineFigureGenerator('TenPointedBurst', (shape, w, h) => {
//     const burstPoints = createBurst(10);
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(burstPoints[0].x * w, burstPoints[0].y * h, true);
//     geo.add(fig);
//     for (let i = 1; i < burstPoints.length; i += 3) {
//         fig.add(new go.PathSegment(go.SegmentType.Bezier, burstPoints[i + 2].x * w, burstPoints[i + 2].y * h, burstPoints[i].x * w, burstPoints[i].y * h, burstPoints[i + 1].x * w, burstPoints[i + 1].y * h));
//     }
//     const lst = fig.segments.last();
//     if (lst !== null)
//         lst.close();
//     freeArray(burstPoints);
//     geo.spot1 = new go.Spot(0.222, 0.222);
//     geo.spot2 = new go.Spot(0.777, 0.777);
//     return geo;
// });
// FigureParameter.setFigureParameter('FramedRectangle', 0, new FigureParameter('ThicknessX', 8));
// FigureParameter.setFigureParameter('FramedRectangle', 1, new FigureParameter('ThicknessY', 8));
// go.Shape.defineFigureGenerator('FramedRectangle', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN;
//     let param2 = shape ? shape.parameter2 : NaN;
//     if (isNaN(param1))
//         param1 = 8; // default values PARAMETER 1 is for WIDTH
//     if (isNaN(param2))
//         param2 = 8; // default values PARAMETER 2 is for HEIGHT
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0, true);
//     geo.add(fig);
//     // outer rectangle, clockwise
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h).close());
//     if (param1 < w / 2 && param2 < h / 2) {
//         // inner rectangle, counter-clockwise
//         fig.add(new go.PathSegment(go.SegmentType.Move, param1, param2)); // subpath
//         fig.add(new go.PathSegment(go.SegmentType.Line, param1, h - param2));
//         fig.add(new go.PathSegment(go.SegmentType.Line, w - param1, h - param2));
//         fig.add(new go.PathSegment(go.SegmentType.Line, w - param1, param2).close());
//     }
//     geo.setSpots(0, 0, 1, 1, param1, param2, -param1, -param2);
//     return geo;
// });
// FigureParameter.setFigureParameter('Ring', 0, new FigureParameter('Thickness', 8));
// go.Shape.defineFigureGenerator('Ring', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN;
//     if (isNaN(param1) || param1 < 0)
//         param1 = 8;
//     const rad = w / 2;
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(w, w / 2, true); // clockwise
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Arc, 0, 360, rad, rad, rad, rad).close());
//     const rad2 = Math.max(rad - param1, 0);
//     if (rad2 > 0) {
//         // counter-clockwise
//         fig.add(new go.PathSegment(go.SegmentType.Move, w / 2 + rad2, w / 2));
//         fig.add(new go.PathSegment(go.SegmentType.Arc, 0, -360, rad, rad, rad2, rad2).close());
//     }
//     geo.spot1 = GeneratorEllipseSpot1;
//     geo.spot2 = GeneratorEllipseSpot2;
//     geo.defaultStretch = go.GeometryStretch.Uniform;
//     return geo;
// });
// go.Shape.defineFigureGenerator('Cloud', (shape, w, h) => new go.Geometry()
//     .add(new go.PathFigure(0.08034461 * w, 0.1944299 * h, true)
//     .add(new go.PathSegment(go.SegmentType.Bezier, 0.2008615 * w, 0.05349299 * h, -0.09239631 * w, 0.07836421 * h, 0.1406031 * w, -0.0542823 * h))
//     .add(new go.PathSegment(go.SegmentType.Bezier, 0.4338609 * w, 0.074219 * h, 0.2450511 * w, -0.00697547 * h, 0.3776197 * w, -0.01112067 * h))
//     .add(new go.PathSegment(go.SegmentType.Bezier, 0.6558228 * w, 0.07004196 * h, 0.4539471 * w, 0, 0.6066018 * w, -0.02526587 * h))
//     .add(new go.PathSegment(go.SegmentType.Bezier, 0.8921095 * w, 0.08370865 * h, 0.6914277 * w, -0.01904177 * h, 0.8921095 * w, -0.01220843 * h))
//     .add(new go.PathSegment(go.SegmentType.Bezier, 0.9147671 * w, 0.3194596 * h, 1.036446 * w, 0.04105738 * h, 1.020377 * w, 0.3022052 * h))
//     .add(new go.PathSegment(go.SegmentType.Bezier, 0.9082935 * w, 0.562044 * h, 1.04448 * w, 0.360238 * h, 0.992256 * w, 0.5219009 * h))
//     .add(new go.PathSegment(go.SegmentType.Bezier, 0.9212406 * w, 0.8217117 * h, 1.032337 * w, 0.5771781 * h, 1.018411 * w, 0.8120651 * h))
//     .add(new go.PathSegment(go.SegmentType.Bezier, 0.7592566 * w, 0.9156953 * h, 1.028411 * w, 0.9571472 * h, 0.8556702 * w, 1.052487 * h))
//     .add(new go.PathSegment(go.SegmentType.Bezier, 0.5101666 * w, 0.9310455 * h, 0.7431877 * w, 1.009325 * h, 0.5624123 * w, 1.021761 * h))
//     .add(new go.PathSegment(go.SegmentType.Bezier, 0.2609328 * w, 0.9344623 * h, 0.4820677 * w, 1.031761 * h, 0.3030112 * w, 1.002796 * h))
//     .add(new go.PathSegment(go.SegmentType.Bezier, 0.08034461 * w, 0.870098 * h, 0.2329994 * w, 1.01518 * h, 0.03213784 * w, 1.01518 * h))
//     .add(new go.PathSegment(go.SegmentType.Bezier, 0.06829292 * w, 0.6545475 * h, -0.02812061 * w, 0.9032597 * h, -0.01205169 * w, 0.6835638 * h))
//     .add(new go.PathSegment(go.SegmentType.Bezier, 0.06427569 * w, 0.4265613 * h, -0.01812061 * w, 0.6089503 * h, -0.00606892 * w, 0.4555777 * h))
//     .add(new go.PathSegment(go.SegmentType.Bezier, 0.08034461 * w, 0.1944299 * h, -0.01606892 * w, 0.3892545 * h, -0.01205169 * w, 0.1944299 * h)))
//     .setSpots(0.1, 0.1, 0.9, 0.9));
// go.Shape.defineFigureGenerator('StopSign', (shape, w, h) => {
//     const part = 1 / (Math.SQRT2 + 2);
//     return new go.Geometry()
//         .add(new go.PathFigure(part * w, 0, true)
//         .add(new go.PathSegment(go.SegmentType.Line, (1 - part) * w, 0))
//         .add(new go.PathSegment(go.SegmentType.Line, w, part * h))
//         .add(new go.PathSegment(go.SegmentType.Line, w, (1 - part) * h))
//         .add(new go.PathSegment(go.SegmentType.Line, (1 - part) * w, h))
//         .add(new go.PathSegment(go.SegmentType.Line, part * w, h))
//         .add(new go.PathSegment(go.SegmentType.Line, 0, (1 - part) * h))
//         .add(new go.PathSegment(go.SegmentType.Line, 0, part * h).close()))
//         .setSpots(part / 2, part / 2, 1 - part / 2, 1 - part / 2);
// });
// FigureParameter.setFigureParameter('Pie', 0, new FigureParameter('Start', 0, -360, 360));
// FigureParameter.setFigureParameter('Pie', 1, new FigureParameter('Sweep', 315, -360, 360));
// go.Shape.defineFigureGenerator('Pie', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN;
//     let param2 = shape ? shape.parameter2 : NaN;
//     if (isNaN(param1))
//         param1 = 0; // default values PARAMETER 1 is for Start Angle
//     if (isNaN(param2))
//         param2 = 315; // default values PARAMETER 2 is for Sweep Angle
//     let start = param1 % 360;
//     if (start < 0)
//         start += 360;
//     const sweep = param2 % 360;
//     const rad = Math.min(w, h) / 2;
//     return new go.Geometry().add(new go.PathFigure(rad, rad) // start point
//         .add(new go.PathSegment(go.SegmentType.Arc, start, sweep, // angles
//     rad, rad, // center
//     rad, rad) // radius
//         .close()));
// });
// go.Shape.defineFigureGenerator('PiePiece', (shape, w, h) => {
//     const factor = (KAPPA / Math.SQRT2) * 0.5;
//     const x1 = Math.SQRT2 / 2;
//     const y1 = 1 - Math.SQRT2 / 2;
//     return new go.Geometry().add(new go.PathFigure(w, h, true)
//         .add(new go.PathSegment(go.SegmentType.Bezier, x1 * w, y1 * h, w, (1 - factor) * h, (x1 + factor) * w, (y1 + factor) * h))
//         .add(new go.PathSegment(go.SegmentType.Line, 0, h).close()));
// });
// FigureParameter.setFigureParameter('ThickCross', 0, new FigureParameter('Thickness', 30));
// go.Shape.defineFigureGenerator('ThickCross', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN;
//     if (isNaN(param1) || param1 < 0)
//         param1 = 30;
//     const t = Math.min(param1, w) / 2;
//     const mx = w / 2;
//     const my = h / 2;
//     return new go.Geometry().add(new go.PathFigure(mx - t, 0, true)
//         .add(new go.PathSegment(go.SegmentType.Line, mx + t, 0))
//         .add(new go.PathSegment(go.SegmentType.Line, mx + t, my - t))
//         .add(new go.PathSegment(go.SegmentType.Line, w, my - t))
//         .add(new go.PathSegment(go.SegmentType.Line, w, my + t))
//         .add(new go.PathSegment(go.SegmentType.Line, mx + t, my + t))
//         .add(new go.PathSegment(go.SegmentType.Line, mx + t, h))
//         .add(new go.PathSegment(go.SegmentType.Line, mx - t, h))
//         .add(new go.PathSegment(go.SegmentType.Line, mx - t, my + t))
//         .add(new go.PathSegment(go.SegmentType.Line, 0, my + t))
//         .add(new go.PathSegment(go.SegmentType.Line, 0, my - t))
//         .add(new go.PathSegment(go.SegmentType.Line, mx - t, my - t).close()));
// });
// FigureParameter.setFigureParameter('ThinCross', 0, new FigureParameter('Thickness', 10));
// go.Shape.defineFigureGenerator('ThinCross', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN;
//     if (isNaN(param1) || param1 < 0)
//         param1 = 10;
//     const t = Math.min(param1, w) / 2;
//     const mx = w / 2;
//     const my = h / 2;
//     return new go.Geometry().add(new go.PathFigure(mx - t, 0, true)
//         .add(new go.PathSegment(go.SegmentType.Line, mx + t, 0))
//         .add(new go.PathSegment(go.SegmentType.Line, mx + t, my - t))
//         .add(new go.PathSegment(go.SegmentType.Line, w, my - t))
//         .add(new go.PathSegment(go.SegmentType.Line, w, my + t))
//         .add(new go.PathSegment(go.SegmentType.Line, mx + t, my + t))
//         .add(new go.PathSegment(go.SegmentType.Line, mx + t, h))
//         .add(new go.PathSegment(go.SegmentType.Line, mx - t, h))
//         .add(new go.PathSegment(go.SegmentType.Line, mx - t, my + t))
//         .add(new go.PathSegment(go.SegmentType.Line, 0, my + t))
//         .add(new go.PathSegment(go.SegmentType.Line, 0, my - t))
//         .add(new go.PathSegment(go.SegmentType.Line, mx - t, my - t).close()));
// });
// FigureParameter.setFigureParameter('ThickX', 0, new FigureParameter('Thickness', 30));
// go.Shape.defineFigureGenerator('ThickX', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN;
//     if (isNaN(param1) || param1 < 0)
//         param1 = 30;
//     if (w === 0 || h === 0) {
//         const geo = new go.Geometry(go.GeometryType.Rectangle);
//         geo.startX = 0;
//         geo.startY = 0;
//         geo.endX = w;
//         geo.endY = h;
//         return geo;
//     }
//     else {
//         const w2 = w / 2;
//         const h2 = h / 2;
//         const a2 = Math.atan2(h, w);
//         const dx = param1 - Math.min((Math.cos(a2) * param1) / 2, w2);
//         const dy = param1 - Math.min((Math.sin(a2) * param1) / 2, h2);
//         const geo = new go.Geometry();
//         const fig = new go.PathFigure(dx, 0, true);
//         geo.add(fig);
//         fig.add(new go.PathSegment(go.SegmentType.Line, w2, 0.2 * h));
//         fig.add(new go.PathSegment(go.SegmentType.Line, w - dx, 0));
//         fig.add(new go.PathSegment(go.SegmentType.Line, w, dy));
//         fig.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, h2));
//         fig.add(new go.PathSegment(go.SegmentType.Line, w, h - dy));
//         fig.add(new go.PathSegment(go.SegmentType.Line, w - dx, h));
//         fig.add(new go.PathSegment(go.SegmentType.Line, w2, 0.8 * h));
//         fig.add(new go.PathSegment(go.SegmentType.Line, dx, h));
//         fig.add(new go.PathSegment(go.SegmentType.Line, 0, h - dy));
//         fig.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, h2));
//         fig.add(new go.PathSegment(go.SegmentType.Line, 0, dy).close());
//         return geo;
//     }
// });
// FigureParameter.setFigureParameter('ThinX', 0, new FigureParameter('Thickness', 10));
// go.Shape.defineFigureGenerator('ThinX', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN;
//     if (isNaN(param1) || param1 < 0)
//         param1 = 10;
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0.1 * w, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.4 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.9 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.1 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.6 * w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.9 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.9 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.6 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.1 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.9 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.4 * w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.1 * h).close());
//     return geo;
// });
// // adjust the width of the vertical beam
// FigureParameter.setFigureParameter('SquareIBeam', 0, new FigureParameter('BeamWidth', 0.2, 0.1, 0.9));
// go.Shape.defineFigureGenerator('SquareIBeam', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN; // width of the ibeam in % of the total width
//     if (isNaN(param1))
//         param1 = 0.2;
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, param1 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, (0.5 + param1 / 2) * w, param1 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, (0.5 + param1 / 2) * w, (1 - param1) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, (1 - param1) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, (1 - param1) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, (0.5 - param1 / 2) * w, (1 - param1) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, (0.5 - param1 / 2) * w, param1 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, param1 * h).close());
//     return geo;
// });
// // parameter allows it easy to adjust the roundness of the curves that cut inward
// FigureParameter.setFigureParameter('RoundedIBeam', 0, new FigureParameter('Curviness', 0.5, 0.05, 0.65));
// go.Shape.defineFigureGenerator('RoundedIBeam', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN; // curviness of the ibeam relative to total width
//     if (isNaN(param1))
//         param1 = 0.5;
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, w, h, Math.abs(1 - param1) * w, 0.25 * h, Math.abs(1 - param1) * w, 0.75 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, 0, param1 * w, 0.75 * h, param1 * w, 0.25 * h).close());
//     return geo;
// });
go.Shape.defineFigureGenerator('HalfEllipse', (shape, w, h) => new go.Geometry()
    .add(new go.PathFigure(0, 0, true)
    .add(new go.PathSegment(go.SegmentType.Bezier, w, 0.5 * h, KAPPA * w, 0, w, (0.5 - KAPPA / 2) * h))
    .add(new go.PathSegment(go.SegmentType.Bezier, 0, h, w, (0.5 + KAPPA / 2) * h, KAPPA * w, h).close()))
    .setSpots(0, 0.156, 0.844, 0.844));
go.Shape.defineFigureGenerator('Crescent', (shape, w, h) => new go.Geometry()
    .add(new go.PathFigure(0, 0, true)
    .add(new go.PathSegment(go.SegmentType.Bezier, 0, h, w, 0, w, h))
    .add(new go.PathSegment(go.SegmentType.Bezier, 0, 0, 0.5 * w, 0.75 * h, 0.5 * w, 0.25 * h).close()))
    .setSpots(0.311, 0.266, 0.744, 0.744));
go.Shape.defineFigureGenerator('Heart', (shape, w, h) => new go.Geometry()
    .add(new go.PathFigure(0.5 * w, h, true)
    .add(new go.PathSegment(go.SegmentType.Bezier, 0, 0.3 * h, 0.1 * w, 0.8 * h, 0, 0.5 * h))
    .add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 0.3 * h, 0, 0, 0.45 * w, 0))
    .add(new go.PathSegment(go.SegmentType.Bezier, w, 0.3 * h, 0.55 * w, 0, w, 0))
    .add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, h, w, 0.5 * h, 0.9 * w, 0.8 * h).close()))
    .setSpots(0.14, 0.29, 0.86, 0.78));
go.Shape.defineFigureGenerator('Spade', (shape, w, h) => new go.Geometry()
    .add(new go.PathFigure(0.5 * w, 0, true)
    .add(new go.PathSegment(go.SegmentType.Line, 0.51 * w, 0.01 * h))
    .add(new go.PathSegment(go.SegmentType.Bezier, w, 0.5 * h, 0.6 * w, 0.2 * h, w, 0.25 * h))
    .add(new go.PathSegment(go.SegmentType.Bezier, 0.55 * w, 0.7 * h, w, 0.8 * h, 0.6 * w, 0.8 * h))
    .add(new go.PathSegment(go.SegmentType.Bezier, 0.75 * w, h, 0.5 * w, 0.75 * h, 0.55 * w, 0.95 * h))
    .add(new go.PathSegment(go.SegmentType.Line, 0.25 * w, h))
    .add(new go.PathSegment(go.SegmentType.Bezier, 0.45 * w, 0.7 * h, 0.45 * w, 0.95 * h, 0.5 * w, 0.75 * h))
    .add(new go.PathSegment(go.SegmentType.Bezier, 0, 0.5 * h, 0.4 * w, 0.8 * h, 0, 0.8 * h))
    .add(new go.PathSegment(go.SegmentType.Bezier, 0.49 * w, 0.01 * h, 0, 0.25 * h, 0.4 * w, 0.2 * h).close()))
    .setSpots(0.14, 0.26, 0.86, 0.78));
// go.Shape.defineFigureGenerator('Club', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0.4 * w, 0.6 * h, true);
//     geo.add(fig);
//     // Start the base
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.15 * w, h, 0.5 * w, 0.75 * h, 0.45 * w, 0.95 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.85 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.6 * w, 0.6 * h, 0.55 * w, 0.95 * h, 0.5 * w, 0.75 * h));
//     // First circle:
//     let r = 0.2; // radius
//     let cx = 0.3; // offset from Center x
//     let cy = 0; // offset from Center y
//     let d = r * KAPPA;
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (0.5 + cx) * w, (0.5 + r + cy) * h, (0.5 - r + cx) * w, (0.5 + d + cy) * h, (0.5 - d + cx) * w, (0.5 + r + cy) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (1 - 0.5 + r + cx) * w, (0.5 + cy) * h, (0.5 + d + cx) * w, (0.5 + r + cy) * h, (0.5 + r + cx) * w, (0.5 + d + cy) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (0.5 + cx) * w, (0.5 - r + cy) * h, (1 - 0.5 + r + cx) * w, (0.5 - d + cy) * h, (0.5 + d + cx) * w, (0.5 - r + cy) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.65 * w, 0.36771243 * h, (0.5 - d + cx) * w, (0.5 - r + cy) * h, (0.5 - r + cx + 0.05) * w, (0.5 - d + cy - 0.02) * h));
//     r = 0.2; // radius
//     cx = 0; // offset from Center x
//     cy = -0.3; // offset from Center y
//     d = r * KAPPA;
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (1 - 0.5 + r + cx) * w, (0.5 + cy) * h, (0.5 + d + cx) * w, (0.5 + r + cy) * h, (0.5 + r + cx) * w, (0.5 + d + cy) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (0.5 + cx) * w, (0.5 - r + cy) * h, (1 - 0.5 + r + cx) * w, (0.5 - d + cy) * h, (0.5 + d + cx) * w, (0.5 - r + cy) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (0.5 - r + cx) * w, (0.5 + cy) * h, (0.5 - d + cx) * w, (0.5 - r + cy) * h, (0.5 - r + cx) * w, (0.5 - d + cy) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (0.5 - d + cx) * w, (0.5 + r + cy) * h, (0.5 - r + cx) * w, (0.5 + d + cy) * h, (0.5 - d + cx) * w, (0.5 + r + cy) * h));
//     r = 0.2; // radius
//     cx = -0.3; // offset from Center x
//     cy = 0; // offset from Center y
//     d = r * KAPPA;
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (0.5 + cx) * w, (0.5 - r + cy) * h, (1 - 0.5 + r + cx - 0.05) * w, (0.5 - d + cy - 0.02) * h, (0.5 + d + cx) * w, (0.5 - r + cy) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (0.5 - r + cx) * w, (0.5 + cy) * h, (0.5 - d + cx) * w, (0.5 - r + cy) * h, (0.5 - r + cx) * w, (0.5 - d + cy) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (0.5 + cx) * w, (0.5 + r + cy) * h, (0.5 - r + cx) * w, (0.5 + d + cy) * h, (0.5 - d + cx) * w, (0.5 + r + cy) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.4 * w, 0.6 * h, (0.5 + d + cx) * w, (0.5 + r + cy) * h, (0.5 + r + cx) * w, (0.5 + d + cy) * h).close());
//     geo.setSpots(0.06, 0.33, 0.93, 0.68);
//     return geo;
// });
// go.Shape.defineFigureGenerator('YinYang', (shape, w, h) => {
//     const geo = new go.Geometry();
//     let fig = new go.PathFigure(w * 0.5, 0, true);
//     geo.add(fig);
//     // Right semi-circle
//     fig.add(new go.PathSegment(go.SegmentType.Arc, 270, 180, w * 0.5, w * 0.5, w * 0.5, w * 0.5));
//     // bottom semi-circle
//     fig.add(new go.PathSegment(go.SegmentType.Arc, 90, -180, w * 0.5, w * 0.75, w * 0.25, w * 0.25));
//     // top semi-circle
//     fig.add(new go.PathSegment(go.SegmentType.Arc, 90, 180, w * 0.5, w * 0.25, w * 0.25, w * 0.25));
//     const radius = 0.1; // of the small circles
//     const centerx = 0.5;
//     let centery = 0.25;
//     // Top small circle, goes counter-clockwise
//     fig.add(new go.PathSegment(go.SegmentType.Move, (centerx + radius) * w, centery * h));
//     fig.add(new go.PathSegment(go.SegmentType.Arc, 0, -360, w * centerx, h * centery, radius * w, radius * w).close()); // Right semi-circle
//     // Left semi-circle
//     fig = new go.PathFigure(w * 0.5, 0, false);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Arc, 270, -180, w * 0.5, w * 0.5, w * 0.5, w * 0.5));
//     centery = 0.75;
//     // Bottom small circle
//     fig = new go.PathFigure((centerx + radius) * w, centery * h, true); // Not a subpath
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Arc, 0, 360, w * centerx, h * centery, radius * w, radius * w).close()); // Right semi-circle
//     geo.defaultStretch = go.GeometryStretch.Uniform;
//     return geo;
// });
// go.Shape.defineFigureGenerator('Peace', (shape, w, h) => {
//     const a = 1.0 - 0.1464466094067262; // at 45 degrees
//     const w2 = 0.5 * w;
//     const h2 = 0.5 * h;
//     return new go.Geometry().add(new go.PathFigure(w2, 0, false)
//         .add(new go.PathSegment(go.SegmentType.Arc, 270, 360, w2, h2, w2, h2))
//         .add(new go.PathSegment(go.SegmentType.Line, w2, h))
//         .add(new go.PathSegment(go.SegmentType.Move, w2, h2))
//         .add(new go.PathSegment(go.SegmentType.Line, (1.0 - a) * w, a * h))
//         .add(new go.PathSegment(go.SegmentType.Move, w2, h2))
//         .add(new go.PathSegment(go.SegmentType.Line, a * w, a * h)));
// });
// go.Shape.defineFigureGenerator('NotAllowed', (shape, w, h) => {
//     const geo = new go.Geometry();
//     let cpOffset = KAPPA * 0.5;
//     let radius = 0.5;
//     const centerx = 0.5;
//     const centery = 0.5;
//     const fig = new go.PathFigure(centerx * w, (centery - radius) * h);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius) * w, centery * h, (centerx - cpOffset) * w, (centery - radius) * h, (centerx - radius) * w, (centery - cpOffset) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery + radius) * h, (centerx - radius) * w, (centery + cpOffset) * h, (centerx - cpOffset) * w, (centery + radius) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w, centery * h, (centerx + cpOffset) * w, (centery + radius) * h, (centerx + radius) * w, (centery + cpOffset) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery - radius) * h, (centerx + radius) * w, (centery - cpOffset) * h, (centerx + cpOffset) * w, (centery - radius) * h));
//     // Inner circle, composed of two parts, separated by
//     // a beam across going from top-right to bottom-left.
//     radius = 0.4;
//     cpOffset = KAPPA * 0.4;
//     // First we cut up the top right 90 degree curve into two smaller
//     // curves.
//     // Since its clockwise, StartOfArrow is the first of the two points
//     // on the circle. EndOfArrow is the other one.
//     const startOfArrowc1 = tempPoint();
//     const startOfArrowc2 = tempPoint();
//     const startOfArrow = tempPoint();
//     const unused = tempPoint();
//     breakUpBezier(centerx, centery - radius, centerx + cpOffset, centery - radius, centerx + radius, centery - cpOffset, centerx + radius, centery, 0.42, startOfArrowc1, startOfArrowc2, startOfArrow, unused, unused);
//     const endOfArrowc1 = tempPoint();
//     const endOfArrowc2 = tempPoint();
//     const endOfArrow = tempPoint();
//     breakUpBezier(centerx, centery - radius, centerx + cpOffset, centery - radius, centerx + radius, centery - cpOffset, centerx + radius, centery, 0.58, unused, unused, endOfArrow, endOfArrowc1, endOfArrowc2);
//     // Cut up the bottom left 90 degree curve into two smaller curves.
//     const startOfArrow2c1 = tempPoint();
//     const startOfArrow2c2 = tempPoint();
//     const startOfArrow2 = tempPoint();
//     breakUpBezier(centerx, centery + radius, centerx - cpOffset, centery + radius, centerx - radius, centery + cpOffset, centerx - radius, centery, 0.42, startOfArrow2c1, startOfArrow2c2, startOfArrow2, unused, unused);
//     const endOfArrow2c1 = tempPoint();
//     const endOfArrow2c2 = tempPoint();
//     const endOfArrow2 = tempPoint();
//     breakUpBezier(centerx, centery + radius, centerx - cpOffset, centery + radius, centerx - radius, centery + cpOffset, centerx - radius, centery, 0.58, unused, unused, endOfArrow2, endOfArrow2c1, endOfArrow2c2);
//     fig.add(new go.PathSegment(go.SegmentType.Move, endOfArrow2.x * w, endOfArrow2.y * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius) * w, centery * h, endOfArrow2c1.x * w, endOfArrow2c1.y * h, endOfArrow2c2.x * w, endOfArrow2c2.y * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery - radius) * h, (centerx - radius) * w, (centery - cpOffset) * h, (centerx - cpOffset) * w, (centery - radius) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, startOfArrow.x * w, startOfArrow.y * h, startOfArrowc1.x * w, startOfArrowc1.y * h, startOfArrowc2.x * w, startOfArrowc2.y * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, endOfArrow2.x * w, endOfArrow2.y * h).close());
//     fig.add(new go.PathSegment(go.SegmentType.Move, startOfArrow2.x * w, startOfArrow2.y * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, endOfArrow.x * w, endOfArrow.y * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w, centery * h, endOfArrowc1.x * w, endOfArrowc1.y * h, endOfArrowc2.x * w, endOfArrowc2.y * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery + radius) * h, (centerx + radius) * w, (centery + cpOffset) * h, (centerx + cpOffset) * w, (centery + radius) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, startOfArrow2.x * w, startOfArrow2.y * h, startOfArrow2c1.x * w, startOfArrow2c1.y * h, startOfArrow2c2.x * w, startOfArrow2c2.y * h).close());
//     freePoint(startOfArrowc1);
//     freePoint(startOfArrowc2);
//     freePoint(startOfArrow);
//     freePoint(unused);
//     freePoint(endOfArrowc1);
//     freePoint(endOfArrowc2);
//     freePoint(endOfArrow);
//     freePoint(startOfArrow2c1);
//     freePoint(startOfArrow2c2);
//     freePoint(startOfArrow2);
//     freePoint(endOfArrow2c1);
//     freePoint(endOfArrow2c2);
//     freePoint(endOfArrow2);
//     geo.defaultStretch = go.GeometryStretch.Uniform;
//     return geo;
// });
// go.Shape.defineFigureGenerator('Fragile', (shape, w, h) => new go.Geometry().add(new go.PathFigure(0, 0, true)
//     .add(new go.PathSegment(go.SegmentType.Line, 0.25 * w, 0))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, 0.15 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.3 * w, 0.25 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.29 * w, 0.33 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.35 * w, 0.25 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.3 * w, 0.15 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.4 * w, 0))
//     .add(new go.PathSegment(go.SegmentType.Line, w, 0))
//     // Left Side
//     .add(new go.PathSegment(go.SegmentType.Bezier, 0.55 * w, 0.5 * h, w, 0.25 * h, 0.75 * w, 0.5 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.55 * w, 0.9 * h))
//     // The base
//     .add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, 0.9 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.3 * w, h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.3 * w, 0.9 * h))
//     // Right side
//     .add(new go.PathSegment(go.SegmentType.Line, 0.45 * w, 0.9 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.45 * w, 0.5 * h))
//     .add(new go.PathSegment(go.SegmentType.Bezier, 0, 0, 0.25 * w, 0.5 * h, 0, 0.25 * h).close())));
// FigureParameter.setFigureParameter('HourGlass', 0, new FigureParameter('Thickness', 30));
// go.Shape.defineFigureGenerator('HourGlass', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN; // width at middle of hourglass
//     if (isNaN(param1) || param1 < 0)
//         param1 = 30;
//     if (param1 > w)
//         param1 = w;
//     const x1 = (w - param1) / 2;
//     const x2 = x1 + param1;
//     return new go.Geometry().add(new go.PathFigure(x2, 0.5 * h)
//         .add(new go.PathSegment(go.SegmentType.Line, w, h))
//         .add(new go.PathSegment(go.SegmentType.Line, 0, h))
//         .add(new go.PathSegment(go.SegmentType.Line, x1, 0.5 * h))
//         .add(new go.PathSegment(go.SegmentType.Line, 0, 0))
//         .add(new go.PathSegment(go.SegmentType.Line, w, 0).close()));
// });
// go.Shape.defineFigureGenerator('Lightning', (shape, w, h) => new go.Geometry().add(new go.PathFigure(0, 0.55 * h)
//     .add(new go.PathSegment(go.SegmentType.Line, 0.6 * w, 0))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.3 * w, 0.45 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, w, 0.45 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.4 * w, h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, 0.55 * h).close())));
// go.Shape.defineFigureGenerator('GenderMale', (shape, w, h) => {
//     const geo = new go.Geometry();
//     let cpOffset = KAPPA * 0.4;
//     let radius = 0.4;
//     const centerx = 0.5;
//     const centery = 0.5;
//     const unused = tempPoint();
//     const mid = tempPoint();
//     const c1 = tempPoint();
//     const c2 = tempPoint();
//     const fig = new go.PathFigure((centerx - radius) * w, centery * h, false);
//     geo.add(fig);
//     // Outer circle
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery - radius) * h, (centerx - radius) * w, (centery - cpOffset) * h, (centerx - cpOffset) * w, (centery - radius) * h));
//     breakUpBezier(centerx, centery - radius, centerx + cpOffset, centery - radius, centerx + radius, centery - cpOffset, centerx + radius, centery, 0.44, c1, c2, mid, unused, unused);
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, mid.x * w, mid.y * h, c1.x * w, c1.y * h, c2.x * w, c2.y * h));
//     const startOfArrow = tempPointAt(mid.x, mid.y);
//     breakUpBezier(centerx, centery - radius, centerx + cpOffset, centery - radius, centerx + radius, centery - cpOffset, centerx + radius, centery, 0.56, unused, unused, mid, c1, c2);
//     const endOfArrow = tempPointAt(mid.x, mid.y);
//     fig.add(new go.PathSegment(go.SegmentType.Line, (startOfArrow.x * 0.1 + 0.95 * 0.9) * w, startOfArrow.y * 0.1 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.85 * w, startOfArrow.y * 0.1 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.85 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.15 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, (endOfArrow.x * 0.1 + 0.9) * w, 0.15 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, (endOfArrow.x * 0.1 + 0.9) * w, (endOfArrow.y * 0.1 + 0.05 * 0.9) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, endOfArrow.x * w, endOfArrow.y * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w, centery * h, c1.x * w, c1.y * h, c2.x * w, c2.y * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery + radius) * h, (centerx + radius) * w, (centery + cpOffset) * h, (centerx + cpOffset) * w, (centery + radius) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius) * w, centery * h, (centerx - cpOffset) * w, (centery + radius) * h, (centerx - radius) * w, (centery + cpOffset) * h));
//     // Inner circle
//     radius = 0.35;
//     cpOffset = KAPPA * 0.35;
//     const fig2 = new go.PathFigure(centerx * w, (centery - radius) * h, false);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius) * w, centery * h, (centerx - cpOffset) * w, (centery - radius) * h, (centerx - radius) * w, (centery - cpOffset) * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery + radius) * h, (centerx - radius) * w, (centery + cpOffset) * h, (centerx - cpOffset) * w, (centery + radius) * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w, centery * h, (centerx + cpOffset) * w, (centery + radius) * h, (centerx + radius) * w, (centery + cpOffset) * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery - radius) * h, (centerx + radius) * w, (centery - cpOffset) * h, (centerx + cpOffset) * w, (centery - radius) * h));
//     const fig3 = new go.PathFigure((centerx - radius) * w, centery * h, false);
//     geo.add(fig3);
//     freePoint(unused);
//     freePoint(mid);
//     freePoint(c1);
//     freePoint(c2);
//     freePoint(startOfArrow);
//     freePoint(endOfArrow);
//     geo.spot1 = new go.Spot(0.202, 0.257);
//     geo.spot2 = new go.Spot(0.792, 0.739);
//     geo.defaultStretch = go.GeometryStretch.Uniform;
//     return geo;
// });
// go.Shape.defineFigureGenerator('GenderFemale', (shape, w, h) => {
//     const geo = new go.Geometry();
//     // Outer Circle
//     let r = 0.375; // radius
//     let cx = 0; // offset from Center x
//     let cy = -0.125; // offset from Center y
//     let d = r * KAPPA;
//     let fig = new go.PathFigure((0.525 + cx) * w, (0.5 + r + cy) * h, false);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (1 - 0.5 + r + cx) * w, (0.5 + cy) * h, (0.5 + d + cx) * w, (0.5 + r + cy) * h, (0.5 + r + cx) * w, (0.5 + d + cy) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (0.5 + cx) * w, (0.5 - r + cy) * h, (1 - 0.5 + r + cx) * w, (0.5 - d + cy) * h, (0.5 + d + cx) * w, (0.5 - r + cy) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (0.5 - r + cx) * w, (0.5 + cy) * h, (0.5 - d + cx) * w, (0.5 - r + cy) * h, (0.5 - r + cx) * w, (0.5 - d + cy) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (0.475 + cx) * w, (0.5 + r + cy) * h, (0.5 - r + cx) * w, (0.5 + d + cy) * h, (0.5 - d + cx) * w, (0.5 + r + cy) * h));
//     // Legs
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.475 * w, 0.85 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.425 * w, 0.85 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.425 * w, 0.9 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.475 * w, 0.9 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.475 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.525 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.525 * w, 0.9 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.575 * w, 0.9 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.575 * w, 0.85 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.525 * w, 0.85 * h).close());
//     // Inner circle
//     r = 0.325; // radius
//     cx = 0; // offset from Center x
//     cy = -0.125; // offset from Center y
//     d = r * KAPPA;
//     fig = new go.PathFigure((1 - 0.5 + r + cx) * w, (0.5 + cy) * h, false);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (0.5 + cx) * w, (0.5 + r + cy) * h, (0.5 + r + cx) * w, (0.5 + d + cy) * h, (0.5 + d + cx) * w, (0.5 + r + cy) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (0.5 - r + cx) * w, (0.5 + cy) * h, (0.5 - d + cx) * w, (0.5 + r + cy) * h, (0.5 - r + cx) * w, (0.5 + d + cy) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (0.5 + cx) * w, (0.5 - r + cy) * h, (0.5 - r + cx) * w, (0.5 - d + cy) * h, (0.5 - d + cx) * w, (0.5 - r + cy) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (1 - 0.5 + r + cx) * w, (0.5 + cy) * h, (0.5 + d + cx) * w, (0.5 - r + cy) * h, (1 - 0.5 + r + cx) * w, (0.5 - d + cy) * h));
//     fig = new go.PathFigure((0.525 + cx) * w, (0.5 + r + cy) * h, false);
//     geo.add(fig);
//     geo.spot1 = new go.Spot(0.232, 0.136);
//     geo.spot2 = new go.Spot(0.682, 0.611);
//     geo.defaultStretch = go.GeometryStretch.Uniform;
//     return geo;
// });
// go.Shape.defineFigureGenerator('LogicImplies', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN;
//     if (isNaN(param1))
//         param1 = 0.2; // Distance the arrow folds from the right
//     return new go.Geometry()
//         .add(new go.PathFigure((1 - param1) * w, 0, false)
//         .add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h))
//         .add(new go.PathSegment(go.SegmentType.Line, (1 - param1) * w, h))
//         .add(new go.PathSegment(go.SegmentType.Move, 0, 0.5 * h))
//         .add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h)))
//         .setSpots(0, 0, 0.8, 0.5);
// });
// go.Shape.defineFigureGenerator('LogicIff', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN;
//     if (isNaN(param1))
//         param1 = 0.2; // Distance the arrow folds from the right
//     return new go.Geometry()
//         .add(new go.PathFigure((1 - param1) * w, 0, false)
//         .add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h))
//         .add(new go.PathSegment(go.SegmentType.Line, (1 - param1) * w, h))
//         .add(new go.PathSegment(go.SegmentType.Move, 0, 0.5 * h))
//         .add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h))
//         .add(new go.PathSegment(go.SegmentType.Move, param1 * w, 0))
//         .add(new go.PathSegment(go.SegmentType.Line, 0, 0.5 * h))
//         .add(new go.PathSegment(go.SegmentType.Line, param1 * w, h)))
//         .setSpots(0.2, 0, 0.8, 0.5);
// });
// go.Shape.defineFigureGenerator('LogicNot', (shape, w, h) => new go.Geometry().add(new go.PathFigure(0, 0, false)
//     .add(new go.PathSegment(go.SegmentType.Line, w, 0))
//     .add(new go.PathSegment(go.SegmentType.Line, w, h))));
// go.Shape.defineFigureGenerator('LogicAnd', (shape, w, h) => new go.Geometry()
//     .add(new go.PathFigure(0, h, false)
//     .add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0))
//     .add(new go.PathSegment(go.SegmentType.Line, w, h)))
//     .setSpots(0.25, 0.5, 0.75, 1));
// go.Shape.defineFigureGenerator('LogicOr', (shape, w, h) => new go.Geometry()
//     .add(new go.PathFigure(0, 0, false)
//     .add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, h))
//     .add(new go.PathSegment(go.SegmentType.Line, w, 0)))
//     .setSpots(0.219, 0, 0.78, 0.409));
// go.Shape.defineFigureGenerator('LogicXor', (shape, w, h) => {
//     const geo = new go.Geometry().add(new go.PathFigure(0.5 * w, 0, false)
//         .add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, h))
//         .add(new go.PathSegment(go.SegmentType.Move, 0, 0.5 * h))
//         .add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h))
//         .add(new go.PathSegment(go.SegmentType.Arc, 0, 360, 0.5 * w, 0.5 * h, 0.5 * w, 0.5 * h)));
//     geo.defaultStretch = go.GeometryStretch.Uniform;
//     return geo;
// });
// go.Shape.defineFigureGenerator('LogicTruth', (shape, w, h) => new go.Geometry().add(new go.PathFigure(0, 0, false)
//     .add(new go.PathSegment(go.SegmentType.Line, w, 0))
//     .add(new go.PathSegment(go.SegmentType.Move, 0.5 * w, 0))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, h))));
// go.Shape.defineFigureGenerator('LogicFalsity', (shape, w, h) => new go.Geometry().add(new go.PathFigure(0, h, false)
//     .add(new go.PathSegment(go.SegmentType.Line, w, h))
//     .add(new go.PathSegment(go.SegmentType.Move, 0.5 * w, h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0))));
// go.Shape.defineFigureGenerator('LogicThereExists', (shape, w, h) => new go.Geometry().add(new go.PathFigure(0, 0, false)
//     .add(new go.PathSegment(go.SegmentType.Line, w, 0))
//     .add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0, 0.5 * h))
//     .add(new go.PathSegment(go.SegmentType.Move, w, 0.5 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, w, h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0, h))));
// go.Shape.defineFigureGenerator('LogicForAll', (shape, w, h) => new go.Geometry()
//     .add(new go.PathFigure(0, 0, false)
//     .add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, h))
//     .add(new go.PathSegment(go.SegmentType.Line, w, 0))
//     .add(new go.PathSegment(go.SegmentType.Move, 0.25 * w, 0.5 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.75 * w, 0.5 * h)))
//     .setSpots(0.25, 0, 0.75, 0.5));
// go.Shape.defineFigureGenerator('LogicIsDefinedAs', (shape, w, h) => new go.Geometry()
//     .add(new go.PathFigure(0, 0, false)
//     .add(new go.PathSegment(go.SegmentType.Line, w, 0))
//     .add(new go.PathSegment(go.SegmentType.Move, 0, 0.5 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h))
//     .add(new go.PathSegment(go.SegmentType.Move, 0, h))
//     .add(new go.PathSegment(go.SegmentType.Line, w, h)))
//     .setSpots(0.01, 0.01, 0.99, 0.49));
// go.Shape.defineFigureGenerator('LogicIntersect', (shape, w, h) => {
//     const radius = 0.5;
//     return new go.Geometry()
//         .add(new go.PathFigure(0, h, false)
//         .add(new go.PathSegment(go.SegmentType.Line, 0, radius * h))
//         .add(new go.PathSegment(go.SegmentType.Arc, 180, 180, radius * w, radius * h, radius * w, radius * h))
//         .add(new go.PathSegment(go.SegmentType.Line, w, h)))
//         .setSpots(0, 0.5, 1, 1);
// });
// go.Shape.defineFigureGenerator('LogicUnion', (shape, w, h) => {
//     const radius = 0.5;
//     return new go.Geometry()
//         .add(new go.PathFigure(w, 0, false)
//         .add(new go.PathSegment(go.SegmentType.Line, w, radius * h))
//         .add(new go.PathSegment(go.SegmentType.Arc, 0, 180, radius * w, radius * h, radius * w, radius * h))
//         .add(new go.PathSegment(go.SegmentType.Line, 0, 0)))
//         .setSpots(0, 0, 1, 0.5);
// });
// FigureParameter.setFigureParameter('Arrow', 0, new FigureParameter('ArrowheadWidth', 0.3, 0.01, 0.99));
// FigureParameter.setFigureParameter('Arrow', 1, new FigureParameter('TailHeight', 0.3, 0.01, 0.99));
// go.Shape.defineFigureGenerator('Arrow', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN; // % width of arrowhead
//     if (isNaN(param1))
//         param1 = 0.3;
//     let param2 = shape ? shape.parameter2 : NaN; // % height of tail
//     if (isNaN(param2))
//         param2 = 0.3;
//     const x = (1 - param1) * w;
//     const y1 = (0.5 - param2 / 2) * h;
//     const y2 = (0.5 + param2 / 2) * h;
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, y1, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, x, y1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, x, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, x, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, x, y2));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, y2).close());
//     geo.spot1 = new go.Spot(0, y1 / h);
//     const temp = getIntersection(0, y2 / h, 1, y2 / h, x / w, 1, 1, 0.5, tempPoint());
//     geo.spot2 = new go.Spot(temp.x, temp.y);
//     freePoint(temp);
//     return geo;
// });
// // Arrow with absolutes instead of scaling
// FigureParameter.setFigureParameter('Arrow2', 0, new FigureParameter('ArrowheadWidth', 30));
// FigureParameter.setFigureParameter('Arrow2', 1, new FigureParameter('TailHeight', 30));
// go.Shape.defineFigureGenerator('Arrow2', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN; // width of arrowhead
//     if (isNaN(param1))
//         param1 = 30;
//     if (param1 > w)
//         param1 = w;
//     let param2 = shape ? shape.parameter2 : NaN; // height of tail
//     if (isNaN(param2))
//         param2 = 30;
//     param2 = Math.min(param2, h / 2);
//     const x = w - param1;
//     const y1 = (h - param2) / 2;
//     const y2 = y1 + param2;
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, y1, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, x, y1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, x, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, x, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, x, y2));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, y2).close());
//     geo.spot1 = new go.Spot(0, y1 / h);
//     const temp = getIntersection(0, y2 / h, 1, y2 / h, x / w, 1, 1, 0.5, tempPoint());
//     geo.spot2 = new go.Spot(temp.x, temp.y);
//     freePoint(temp);
//     return geo;
// });
// go.Shape.defineFigureGenerator('Chevron', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.5 * h).close());
//     return geo;
// });
// go.Shape.defineFigureGenerator('DoubleArrow', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.3 * w, 0.214 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.3 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 1.0 * w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.3 * w, 1.0 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.3 * w, 0.786 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 1.0 * h).close());
//     return geo;
// });
// FigureParameter.setFigureParameter('DoubleEndArrow', 0, new FigureParameter('ConnecterHeight', 0.3, 0.01, 0.99));
// go.Shape.defineFigureGenerator('DoubleEndArrow', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN; // height of midsection
//     if (isNaN(param1))
//         param1 = 0.3;
//     const y1 = (0.5 - param1 / 2) * h;
//     const y2 = (0.5 + param1 / 2) * h;
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(w, 0.5 * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, y2));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.3 * w, y2));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.3 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.3 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.3 * w, y1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, y1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, 0).close());
//     let temp = getIntersection(0, 0.5, 0.3, 0, 0, y1 / h, 0.1, y1 / h, tempPoint());
//     geo.spot1 = new go.Spot(temp.x, temp.y);
//     temp = getIntersection(0.7, 1, 1, 0.5, 0, y2 / h, 1, y2 / h, temp);
//     geo.spot2 = new go.Spot(temp.x, temp.y);
//     freePoint(temp);
//     return geo;
// });
// // DoubleEndArrow with absolutes instead of scaling
// FigureParameter.setFigureParameter('DoubleEndArrow2', 0, new FigureParameter('ConnecterHeight', 40));
// FigureParameter.setFigureParameter('DoubleEndArrow2', 1, new FigureParameter('ArrowHeight', 100));
// go.Shape.defineFigureGenerator('DoubleEndArrow2', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN; // height of midsection
//     if (isNaN(param1))
//         param1 = 40;
//     let param2 = shape ? shape.parameter2 : NaN; // height of arrows
//     if (isNaN(param2))
//         param2 = 100;
//     /*
//       y1outer
//         /|     |\
//        / |     | \
//       /  y1----   \
//      /             \
//      \             /
//       \  y2----   /
//        \ |     | /
//         \|     |/
//       y2outer
//     */
//     let y1 = (h - param1) / 2;
//     let y2 = y1 + param1;
//     let y1outer = (h - param2) / 2;
//     let y2outer = y1outer + param2;
//     if (param1 > h || param2 > h) {
//         if (param2 > param1) {
//             param1 = (param1 * h) / param2; // use similar ratio
//             y1 = (h - param1) / 2;
//             y2 = y1 + param1;
//             y1outer = 0;
//             y2outer = h;
//         }
//         else {
//             y1 = 0;
//             y2 = h;
//             y1outer = 0;
//             y2outer = h;
//         }
//     }
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(w, 0.5 * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, y2outer));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, y2));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.3 * w, y2));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.3 * w, y2outer));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.3 * w, y1outer));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.3 * w, y1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, y1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, y1outer).close());
//     let temp = getIntersection(0, 0.5, 0.3, y1outer / h, 0, y1 / h, 1, y1 / h, tempPoint());
//     geo.spot1 = new go.Spot(temp.x, temp.y);
//     temp = getIntersection(0.7, y2outer / h, 1, 0.5, 0, y2 / h, 1, y2 / h, temp);
//     geo.spot2 = new go.Spot(temp.x, temp.y);
//     freePoint(temp);
//     return geo;
// });
// FigureParameter.setFigureParameter('IBeamArrow', 0, new FigureParameter('ConnectorHeight', 0.3, 0.01, 0.99));
// go.Shape.defineFigureGenerator('IBeamArrow', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN; // height of midsection
//     if (isNaN(param1))
//         param1 = 0.3;
//     const y1 = (0.5 - param1 / 2) * h;
//     const y2 = (0.5 + param1 / 2) * h;
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(w, 0.5 * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, y2));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, y2));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, y1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, y1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, 0).close());
//     geo.spot1 = new go.Spot(0, y1 / h);
//     const temp = getIntersection(0.7, 1, 1, 0.5, 0, y2 / h, 1, y2 / h, tempPoint());
//     geo.spot2 = new go.Spot(temp.x, temp.y);
//     freePoint(temp);
//     return geo;
// });
// // IBeamArrow with absolutes instead of scaling
// FigureParameter.setFigureParameter('IBeamArrow2', 0, new FigureParameter('ConnectorHeight', 40));
// FigureParameter.setFigureParameter('IBeamArrow2', 1, new FigureParameter('BeamArrowHeight', 100));
// go.Shape.defineFigureGenerator('IBeamArrow2', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN; // height of midsection
//     if (isNaN(param1))
//         param1 = 40;
//     let param2 = shape ? shape.parameter2 : NaN; // height of beam and arrow
//     if (isNaN(param2))
//         param2 = 100;
//     let y1 = (h - param1) / 2;
//     let y2 = y1 + param1;
//     let y1outer = (h - param2) / 2;
//     let y2outer = y1outer + param2;
//     if (param1 > h || param2 > h) {
//         if (param2 > param1) {
//             param1 = (param1 * h) / param2; // use similar ratio
//             y1 = (h - param1) / 2;
//             y2 = y1 + param1;
//             y1outer = 0;
//             y2outer = h;
//         }
//         else {
//             y1 = 0;
//             y2 = h;
//             y1outer = 0;
//             y2outer = h;
//         }
//     }
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(w, 0.5 * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, y2outer));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, y2));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, y2));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, y2outer));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, y2outer));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, y1outer));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, y1outer));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, y1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, y1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, y1outer).close());
//     geo.spot1 = new go.Spot(0, y1 / h);
//     const temp = getIntersection(0.7, y2outer / h, 1, 0.5, 0, y2 / h, 1, y2 / h, tempPoint());
//     geo.spot2 = new go.Spot(temp.x, temp.y);
//     freePoint(temp);
//     return geo;
// });
FigureParameter.setFigureParameter('Pointer', 0, new FigureParameter('BackPoint', 0.1, 0, 0.2));
go.Shape.defineFigureGenerator('Pointer', (shape, w, h) => {
    let param1 = shape ? shape.parameter1 : NaN; // how much the back of the pointer comes in
    if (isNaN(param1))
        param1 = 0.1;
    const geo = new go.Geometry();
    const fig = new go.PathFigure(w, 0.5 * h, true);
    geo.add(fig);
    fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
    fig.add(new go.PathSegment(go.SegmentType.Line, param1 * w, 0.5 * h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0).close());
    geo.spot1 = new go.Spot(param1, 0.35);
    const temp = getIntersection(0, 0.65, 1, 0.65, 0, 1, 1, 0.5, tempPoint()); // ?? constant
    geo.spot2 = new go.Spot(temp.x, temp.y);
    freePoint(temp);
    return geo;
});
// FigureParameter.setFigureParameter('RoundedPointer', 0, new FigureParameter('RoundedEdged', 0.3, 0, 0.5));
// go.Shape.defineFigureGenerator('RoundedPointer', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN; // how much the curved back of the pointer comes in
//     if (isNaN(param1))
//         param1 = 0.3;
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(w, 0.5 * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, 0, param1 * w, 0.75 * h, param1 * w, 0.25 * h).close());
//     geo.spot1 = new go.Spot(param1, 0.35);
//     const temp = getIntersection(0, 0.65, 1, 0.65, 0, 1, 1, 0.5, tempPoint()); // ?? constant
//     geo.spot2 = new go.Spot(temp.x, temp.y);
//     freePoint(temp);
//     return geo;
// });
// FigureParameter.setFigureParameter('SplitEndArrow', 0, new FigureParameter('TailHeight', 0.4, 0.01, 0.99));
// go.Shape.defineFigureGenerator('SplitEndArrow', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN; // % height of arrow tail
//     if (isNaN(param1))
//         param1 = 0.4;
//     const y1 = (0.5 - param1 / 2) * h;
//     const y2 = (0.5 + param1 / 2) * h;
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(w, 0.5 * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, y2));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, y2));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, y1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, y1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, 0).close());
//     geo.spot1 = new go.Spot(0.2, y1 / h);
//     const temp = getIntersection(0.7, 1, 1, 0.5, 0, y2 / h, 1, y2 / h, tempPoint());
//     geo.spot2 = new go.Spot(temp.x, temp.y);
//     freePoint(temp);
//     return geo;
// });
// // SplitEndArrow with absolutes instead of scaling
// FigureParameter.setFigureParameter('SplitEndArrow2', 0, new FigureParameter('TailHeight', 40));
// go.Shape.defineFigureGenerator('SplitEndArrow2', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN; // height of arrow tail
//     if (isNaN(param1))
//         param1 = 50;
//     let y1 = (h - param1) / 2;
//     let y2 = y1 + param1;
//     if (param1 > h) {
//         y1 = 0;
//         y2 = h;
//     }
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(w, 0.5 * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, y2));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, y2));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, y1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, y1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, 0).close());
//     geo.spot1 = new go.Spot(0.2, y1 / h);
//     const temp = getIntersection(0.7, 1, 1, 0.5, 0, y2 / h, 1, y2 / h, tempPoint());
//     geo.spot2 = new go.Spot(temp.x, temp.y);
//     freePoint(temp);
//     return geo;
// });
// FigureParameter.setFigureParameter('SquareArrow', 0, new FigureParameter('ArrowPoint', 0.7, 0.2, 0.9));
// go.Shape.defineFigureGenerator('SquareArrow', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN; // pointiness of arrow, lower is more pointy
//     if (isNaN(param1))
//         param1 = 0.7;
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(w, 0.5 * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, param1 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, param1 * w, 0).close());
//     geo.spot1 = go.Spot.TopLeft;
//     geo.spot2 = new go.Spot(param1, 1);
//     return geo;
// });
// go.Shape.defineFigureGenerator('Cone1', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const cpxOffset = KAPPA * 0.5;
//     const cpyOffset = KAPPA * 0.1;
//     const fig = new go.PathFigure(0, 0.9 * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.9 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, h, w, (0.9 + cpyOffset) * h, (0.5 + cpxOffset) * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, 0.9 * h, (0.5 - cpxOffset) * w, h, 0, (0.9 + cpyOffset) * h).close());
//     geo.spot1 = new go.Spot(0.25, 0.5);
//     geo.spot2 = new go.Spot(0.75, 0.97);
//     return geo;
// });
// go.Shape.defineFigureGenerator('Cone2', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0.9 * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, w, 0.9 * h, (1 - 0.85 / 0.9) * w, h, (0.85 / 0.9) * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.9 * h).close());
//     const fig2 = new go.PathFigure(0, 0.9 * h, false);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, w, 0.9 * h, (1 - 0.85 / 0.9) * w, 0.8 * h, (0.85 / 0.9) * w, 0.8 * h));
//     geo.spot1 = new go.Spot(0.25, 0.5);
//     geo.spot2 = new go.Spot(0.75, 0.82);
//     return geo;
// });
// go.Shape.defineFigureGenerator('Cube1', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0.5 * w, h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.85 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.15 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.15 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.85 * h).close());
//     const fig2 = new go.PathFigure(0.5 * w, h, false);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.3 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0, 0.15 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Move, 0.5 * w, 0.3 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w, 0.15 * h));
//     geo.spot1 = new go.Spot(0, 0.3);
//     geo.spot2 = new go.Spot(0.5, 0.85);
//     return geo;
// });
// go.Shape.defineFigureGenerator('Cube2', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0.3 * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.7 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.3 * w, 0).close());
//     const fig2 = new go.PathFigure(0, 0.3 * h, false);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, 0.3 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig2.add(new go.PathSegment(go.SegmentType.Move, 0.7 * w, 0.3 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, h));
//     geo.spot1 = new go.Spot(0, 0.3);
//     geo.spot2 = new go.Spot(0.7, 1);
//     return geo;
// });
// go.Shape.defineFigureGenerator('Cylinder1', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN; // half the height of the ellipse
//     if (isNaN(param1))
//         param1 = 5; // default value
//     param1 = Math.min(param1, h / 3);
//     const geo = new go.Geometry();
//     const cpxOffset = KAPPA * 0.5;
//     const fig = new go.PathFigure(0, param1, true);
//     geo.add(fig);
//     // The base (top)
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 0, 0, KAPPA * param1, (0.5 - cpxOffset) * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 1.0 * w, param1, (0.5 + cpxOffset) * w, 0, 1.0 * w, KAPPA * param1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h - param1));
//     // Bottom curve
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 1.0 * h, 1.0 * w, h - KAPPA * param1, (0.5 + cpxOffset) * w, 1.0 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, h - param1, (0.5 - cpxOffset) * w, 1.0 * h, 0, h - KAPPA * param1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, param1));
//     const fig2 = new go.PathFigure(w, param1, false);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 2 * param1, 1.0 * w, 2 * param1 - KAPPA * param1, (0.5 + cpxOffset) * w, 2 * param1));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0, param1, (0.5 - cpxOffset) * w, 2 * param1, 0, 2 * param1 - KAPPA * param1));
//     geo.spot1 = new go.Spot(0, 0, 0, 2 * param1);
//     geo.spot2 = new go.Spot(1, 1);
//     return geo;
// });
// go.Shape.defineFigureGenerator('Cylinder2', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN; // half the height of the ellipse
//     if (isNaN(param1))
//         param1 = 5; // default value
//     param1 = Math.min(param1, h / 3);
//     const geo = new go.Geometry();
//     const cpxOffset = KAPPA * 0.5;
//     const fig = new go.PathFigure(0, h - param1, true);
//     geo.add(fig);
//     // The body, starting and ending bottom left
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, param1));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 0, 0, KAPPA * param1, (0.5 - cpxOffset) * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, w, param1, (0.5 + cpxOffset) * w, 0, w, KAPPA * param1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h - param1));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, h, w, h - KAPPA * param1, (0.5 + cpxOffset) * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, h - param1, (0.5 - cpxOffset) * w, h, 0, h - KAPPA * param1));
//     const fig2 = new go.PathFigure(0, h - param1, false);
//     geo.add(fig2);
//     // The base (bottom)
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, h - 2 * param1, 0, h - param1 - KAPPA * param1, (0.5 - cpxOffset) * w, h - 2 * param1));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, w, h - param1, (0.5 + cpxOffset) * w, h - 2 * param1, w, h - param1 - KAPPA * param1));
//     geo.spot1 = new go.Spot(0, 0);
//     geo.spot2 = new go.Spot(1, 1, 0, -2 * param1);
//     return geo;
// });
// go.Shape.defineFigureGenerator('Cylinder3', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN; // half the width of the ellipse
//     if (isNaN(param1))
//         param1 = 5; // default value
//     param1 = Math.min(param1, w / 3);
//     const geo = new go.Geometry();
//     const cpyOffset = KAPPA * 0.5;
//     const fig = new go.PathFigure(param1, 0, true);
//     geo.add(fig);
//     // The body, starting and ending top left
//     fig.add(new go.PathSegment(go.SegmentType.Line, w - param1, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, w, 0.5 * h, w - KAPPA * param1, 0, w, (0.5 - cpyOffset) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, w - param1, h, w, (0.5 + cpyOffset) * h, w - KAPPA * param1, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, param1, h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, 0.5 * h, KAPPA * param1, h, 0, (0.5 + cpyOffset) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, param1, 0, 0, (0.5 - cpyOffset) * h, KAPPA * param1, 0));
//     const fig2 = new go.PathFigure(param1, 0, false);
//     geo.add(fig2);
//     // Cylinder line (left)
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, 2 * param1, 0.5 * h, param1 + KAPPA * param1, 0, 2 * param1, (0.5 - cpyOffset) * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, param1, h, 2 * param1, (0.5 + cpyOffset) * h, param1 + KAPPA * param1, h));
//     geo.spot1 = new go.Spot(0, 0, 2 * param1, 0);
//     geo.spot2 = new go.Spot(1, 1);
//     return geo;
// });
// go.Shape.defineFigureGenerator('Cylinder4', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN; // half the width of the ellipse
//     if (isNaN(param1))
//         param1 = 5; // default value
//     param1 = Math.min(param1, w / 3);
//     const geo = new go.Geometry();
//     const cpyOffset = KAPPA * 0.5;
//     const fig = new go.PathFigure(w - param1, 0, true);
//     geo.add(fig);
//     // The body, starting and ending top right
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, w, 0.5 * h, w - KAPPA * param1, 0, w, (0.5 - cpyOffset) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, w - param1, h, w, (0.5 + cpyOffset) * h, w - KAPPA * param1, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, param1, h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, 0.5 * h, KAPPA * param1, h, 0, (0.5 + cpyOffset) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, param1, 0, 0, (0.5 - cpyOffset) * h, KAPPA * param1, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w - param1, 0));
//     const fig2 = new go.PathFigure(w - param1, 0, false);
//     geo.add(fig2);
//     // Cylinder line (right)
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, w - 2 * param1, 0.5 * h, w - param1 - KAPPA * param1, 0, w - 2 * param1, (0.5 - cpyOffset) * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, w - param1, h, w - 2 * param1, (0.5 + cpyOffset) * h, w - param1 - KAPPA * param1, h));
//     geo.spot1 = new go.Spot(0, 0);
//     geo.spot2 = new go.Spot(1, 1, -2 * param1, 0);
//     return geo;
// });
// go.Shape.defineFigureGenerator('Prism1', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0.25 * w, 0.25 * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.75 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h).close());
//     const fig2 = new go.PathFigure(0.25 * w, 0.25 * h, false);
//     geo.add(fig2);
//     // Inner prism line
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, h));
//     geo.spot1 = new go.Spot(0.408, 0.172);
//     geo.spot2 = new go.Spot(0.833, 0.662);
//     return geo;
// });
// go.Shape.defineFigureGenerator('Prism2', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0.25 * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.75 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.25 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.75 * w, 0.75 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h).close());
//     const fig2 = new go.PathFigure(0, h, false);
//     geo.add(fig2);
//     // Inner prism lines
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.25 * w, 0.5 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w, 0.25 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Move, 0, 0.25 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.25 * w, 0.5 * h));
//     geo.spot1 = new go.Spot(0.25, 0.5);
//     geo.spot2 = new go.Spot(0.75, 0.75);
//     return geo;
// });
// go.Shape.defineFigureGenerator('Pyramid1', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0.5 * w, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.75 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.75 * h).close());
//     const fig2 = new go.PathFigure(0.5 * w, 0, false);
//     geo.add(fig2);
//     // Inner pyramind line
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, h));
//     geo.spot1 = new go.Spot(0.25, 0.367);
//     geo.spot2 = new go.Spot(0.75, 0.875);
//     return geo;
// });
// go.Shape.defineFigureGenerator('Pyramid2', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0.5 * w, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.85 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.85 * h).close());
//     const fig2 = new go.PathFigure(0.5 * w, 0, false);
//     geo.add(fig2);
//     // Inner pyramid lines
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.7 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0, 0.85 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Move, 0.5 * w, 0.7 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w, 0.85 * h));
//     geo.spot1 = new go.Spot(0.25, 0.367);
//     geo.spot2 = new go.Spot(0.75, 0.875);
//     return geo;
// });
// go.Shape.defineFigureGenerator('Actor', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const radiusw = 0.2;
//     const radiush = 0.1;
//     const offsetw = KAPPA * radiusw;
//     const offseth = KAPPA * radiush;
//     let centerx = 0.5;
//     let centery = 0.1;
//     const fig = new go.PathFigure(centerx * w, (centery + radiush) * h, true);
//     geo.add(fig);
//     // Head
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radiusw) * w, centery * h, (centerx - offsetw) * w, (centery + radiush) * h, (centerx - radiusw) * w, (centery + offseth) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery - radiush) * h, (centerx - radiusw) * w, (centery - offseth) * h, (centerx - offsetw) * w, (centery - radiush) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radiusw) * w, centery * h, (centerx + offsetw) * w, (centery - radiush) * h, (centerx + radiusw) * w, (centery - offseth) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery + radiush) * h, (centerx + radiusw) * w, (centery + offseth) * h, (centerx + offsetw) * w, (centery + radiush) * h));
//     let r = 0.05;
//     let cpOffset = KAPPA * r;
//     centerx = 0.05;
//     centery = 0.25;
//     const fig2 = new go.PathFigure(0.5 * w, 0.2 * h, true);
//     geo.add(fig2);
//     // Body
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.95 * w, 0.2 * h));
//     centerx = 0.95;
//     centery = 0.25;
//     // Right arm
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + r) * w, centery * h, (centerx + cpOffset) * w, (centery - r) * h, (centerx + r) * w, (centery - cpOffset) * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w, 0.6 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.85 * w, 0.6 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.85 * w, 0.35 * h));
//     r = 0.025;
//     cpOffset = KAPPA * r;
//     centerx = 0.825;
//     centery = 0.35;
//     // Right under arm
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery - r) * h, (centerx + r) * w, (centery - cpOffset) * h, (centerx + cpOffset) * w, (centery - r) * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - r) * w, centery * h, (centerx - cpOffset) * w, (centery - r) * h, (centerx - r) * w, (centery - cpOffset) * h));
//     // Right side/leg
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.55 * w, h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.55 * w, 0.7 * h));
//     // Right in between
//     r = 0.05;
//     cpOffset = KAPPA * r;
//     centerx = 0.5;
//     centery = 0.7;
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery - r) * h, (centerx + r) * w, (centery - cpOffset) * h, (centerx + cpOffset) * w, (centery - r) * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - r) * w, centery * h, (centerx - cpOffset) * w, (centery - r) * h, (centerx - r) * w, (centery - cpOffset) * h));
//     // Left side/leg
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.45 * w, h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, 0.35 * h));
//     r = 0.025;
//     cpOffset = KAPPA * r;
//     centerx = 0.175;
//     centery = 0.35;
//     // Left under arm
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery - r) * h, (centerx + r) * w, (centery - cpOffset) * h, (centerx + cpOffset) * w, (centery - r) * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - r) * w, centery * h, (centerx - cpOffset) * w, (centery - r) * h, (centerx - r) * w, (centery - cpOffset) * h));
//     // Left arm
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.15 * w, 0.6 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0, 0.6 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0, 0.25 * h));
//     r = 0.05;
//     cpOffset = KAPPA * r;
//     centerx = 0.05;
//     centery = 0.25;
//     // Left shoulder
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery - r) * h, (centerx - r) * w, (centery - cpOffset) * h, (centerx - cpOffset) * w, (centery - r) * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.2 * h));
//     geo.spot1 = new go.Spot(0.2, 0.2);
//     geo.spot2 = new go.Spot(0.8, 0.65);
//     return geo;
// });
// FigureParameter.setFigureParameter('Card', 0, new FigureParameter('CornerCutoutSize', 0.2, 0.1, 0.9));
// go.Shape.defineFigureGenerator('Card', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN; // size of corner cutout
//     if (isNaN(param1))
//         param1 = 0.2;
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(w, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, param1 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, param1 * w, 0).close());
//     geo.spot1 = new go.Spot(0, param1);
//     geo.spot2 = go.Spot.BottomRight;
//     return geo;
// });
// go.Shape.defineFigureGenerator('Collate', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0.5 * w, 0.5 * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.5 * h));
//     const fig2 = new go.PathFigure(0.5 * w, 0.5 * h, true);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0, h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.5 * h));
//     geo.spot1 = new go.Spot(0.25, 0);
//     geo.spot2 = new go.Spot(0.75, 0.25);
//     return geo;
// });
// go.Shape.defineFigureGenerator('CreateRequest', (shape, w, h) => {
//     const geo = new go.Geometry();
//     let param1 = shape ? shape.parameter1 : NaN;
//     if (isNaN(param1))
//         param1 = 0.1;
//     const fig = new go.PathFigure(0, 0, true);
//     geo.add(fig);
//     // Body
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h).close());
//     const fig2 = new go.PathFigure(0, param1 * h, false);
//     geo.add(fig2);
//     // Inside lines
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w, param1 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Move, 0, (1 - param1) * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w, (1 - param1) * h));
//     // ??? geo.spot1 = new go.Spot(0, param1);
//     // ??? geo.spot2 = new go.Spot(1, 1 - param1);
//     return geo;
// });
// go.Shape.defineFigureGenerator('Database', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const cpxOffset = KAPPA * 0.5;
//     const cpyOffset = KAPPA * 0.1;
//     const fig = new go.PathFigure(w, 0.1 * h, true);
//     geo.add(fig);
//     // Body
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.9 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, h, w, (0.9 + cpyOffset) * h, (0.5 + cpxOffset) * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, 0.9 * h, (0.5 - cpxOffset) * w, h, 0, (0.9 + cpyOffset) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.1 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 0, 0, (0.1 - cpyOffset) * h, (0.5 - cpxOffset) * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, w, 0.1 * h, (0.5 + cpxOffset) * w, 0, w, (0.1 - cpyOffset) * h));
//     const fig2 = new go.PathFigure(w, 0.1 * h, false);
//     geo.add(fig2);
//     // Rings
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 0.2 * h, w, (0.1 + cpyOffset) * h, (0.5 + cpxOffset) * w, 0.2 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0, 0.1 * h, (0.5 - cpxOffset) * w, 0.2 * h, 0, (0.1 + cpyOffset) * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Move, w, 0.2 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 0.3 * h, w, (0.2 + cpyOffset) * h, (0.5 + cpxOffset) * w, 0.3 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0, 0.2 * h, (0.5 - cpxOffset) * w, 0.3 * h, 0, (0.2 + cpyOffset) * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Move, w, 0.3 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 0.4 * h, w, (0.3 + cpyOffset) * h, (0.5 + cpxOffset) * w, 0.4 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0, 0.3 * h, (0.5 - cpxOffset) * w, 0.4 * h, 0, (0.3 + cpyOffset) * h));
//     geo.spot1 = new go.Spot(0, 0.4);
//     geo.spot2 = new go.Spot(1, 0.9);
//     return geo;
// });
// go.Shape.defineFigureGenerator('DataStorage', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.75 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.75 * w, h, w, 0, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, 0, 0.25 * w, 0.9 * h, 0.25 * w, 0.1 * h).close());
//     geo.spot1 = new go.Spot(0.226, 0);
//     geo.spot2 = new go.Spot(0.81, 1);
//     return geo;
// });
// go.Shape.defineFigureGenerator('DiskStorage', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const cpxOffset = KAPPA * 0.5;
//     const cpyOffset = KAPPA * 0.1;
//     const fig = new go.PathFigure(w, 0.1 * h, true);
//     geo.add(fig);
//     // Body
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.9 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, h, w, (0.9 + cpyOffset) * h, (0.5 + cpxOffset) * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, 0.9 * h, (0.5 - cpxOffset) * w, h, 0, (0.9 + cpyOffset) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.1 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 0, 0, (0.1 - cpyOffset) * h, (0.5 - cpxOffset) * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, w, 0.1 * h, (0.5 + cpxOffset) * w, 0, w, (0.1 - cpyOffset) * h));
//     const fig2 = new go.PathFigure(w, 0.1 * h, false);
//     geo.add(fig2);
//     // Rings
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 0.2 * h, w, (0.1 + cpyOffset) * h, (0.5 + cpxOffset) * w, 0.2 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0, 0.1 * h, (0.5 - cpxOffset) * w, 0.2 * h, 0, (0.1 + cpyOffset) * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Move, w, 0.2 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 0.3 * h, w, (0.2 + cpyOffset) * h, (0.5 + cpxOffset) * w, 0.3 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0, 0.2 * h, (0.5 - cpxOffset) * w, 0.3 * h, 0, (0.2 + cpyOffset) * h));
//     geo.spot1 = new go.Spot(0, 0.3);
//     geo.spot2 = new go.Spot(1, 0.9);
//     return geo;
// });
// go.Shape.defineFigureGenerator('Display', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0.25 * w, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.75 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.75 * w, h, w, 0, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.25 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.5 * h).close());
//     geo.spot1 = new go.Spot(0.25, 0);
//     geo.spot2 = new go.Spot(0.75, 1);
//     return geo;
// });
// go.Shape.defineFigureGenerator('DividedEvent', (shape, w, h) => {
//     const geo = new go.Geometry();
//     let param1 = shape ? shape.parameter1 : NaN;
//     if (isNaN(param1))
//         param1 = 0.2;
//     else if (param1 < 0.15)
//         param1 = 0.15; // Minimum
//     const cpOffset = KAPPA * 0.2;
//     const fig = new go.PathFigure(0, 0.2 * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.2 * w, 0, 0, (0.2 - cpOffset) * h, (0.2 - cpOffset) * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, w, 0.2 * h, (0.8 + cpOffset) * w, 0, w, (0.2 - cpOffset) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.8 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.8 * w, h, w, (0.8 + cpOffset) * h, (0.8 + cpOffset) * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, 0.8 * h, (0.2 - cpOffset) * w, h, 0, (0.8 + cpOffset) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.2 * h));
//     const fig2 = new go.PathFigure(0, param1 * h, false);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w, param1 * h));
//     // ??? geo.spot1 = new go.Spot(0, param1);
//     // ??? geo.spot2 = new go.Spot(1, 1 - param1);
//     return geo;
// });
// go.Shape.defineFigureGenerator('DividedProcess', (shape, w, h) => {
//     const geo = new go.Geometry();
//     let param1 = shape ? shape.parameter1 : NaN;
//     if (isNaN(param1) || param1 < 0.1)
//         param1 = 0.1; // Minimum
//     const fig = new go.PathFigure(0, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h).close());
//     const fig2 = new go.PathFigure(0, param1 * h, false);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w, param1 * h));
//     // ??? geo.spot1 = new go.Spot(0, param1);
//     // ??? geo.spot2 = go.Spot.BottomRight;
//     return geo;
// });
// go.Shape.defineFigureGenerator('Document', (shape, w, h) => {
//     const geo = new go.Geometry();
//     h = h / 0.8;
//     const fig = new go.PathFigure(0, 0.7 * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.7 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, 0.7 * h, 0.5 * w, 0.4 * h, 0.5 * w, h).close());
//     geo.spot1 = go.Spot.TopLeft;
//     geo.spot2 = new go.Spot(1, 0.6);
//     return geo;
// });
// go.Shape.defineFigureGenerator('ExternalOrganization', (shape, w, h) => {
//     const geo = new go.Geometry();
//     let param1 = shape ? shape.parameter1 : NaN;
//     if (isNaN(param1) || param1 < 0.2)
//         param1 = 0.2; // Minimum
//     const fig = new go.PathFigure(0, 0, true);
//     geo.add(fig);
//     // Body
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h).close());
//     const fig2 = new go.PathFigure(param1 * w, 0, false);
//     geo.add(fig2);
//     // Top left triangle
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0, param1 * h));
//     // Top right triangle
//     fig2.add(new go.PathSegment(go.SegmentType.Move, w, param1 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, (1 - param1) * w, 0));
//     // Bottom left triangle
//     fig2.add(new go.PathSegment(go.SegmentType.Move, 0, (1 - param1) * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, param1 * w, h));
//     // Bottom right triangle
//     fig2.add(new go.PathSegment(go.SegmentType.Move, (1 - param1) * w, h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w, (1 - param1) * h));
//     // ??? geo.spot1 = new go.Spot(param1 / 2, param1 / 2);
//     // ??? geo.spot2 = new go.Spot(1 - param1 / 2, 1 - param1 / 2);
//     return geo;
// });
// go.Shape.defineFigureGenerator('ExternalProcess', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0.5 * w, 0, true);
//     geo.add(fig);
//     // Body
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.5 * h).close());
//     const fig2 = new go.PathFigure(0.1 * w, 0.4 * h, false);
//     geo.add(fig2);
//     // Top left triangle
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.1 * w, 0.6 * h));
//     // Top right triangle
//     fig2.add(new go.PathSegment(go.SegmentType.Move, 0.9 * w, 0.6 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.9 * w, 0.4 * h));
//     // Bottom left triangle
//     fig2.add(new go.PathSegment(go.SegmentType.Move, 0.6 * w, 0.1 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.4 * w, 0.1 * h));
//     // Bottom right triangle
//     fig2.add(new go.PathSegment(go.SegmentType.Move, 0.4 * w, 0.9 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.6 * w, 0.9 * h));
//     geo.spot1 = new go.Spot(0.25, 0.25);
//     geo.spot2 = new go.Spot(0.75, 0.75);
//     return geo;
// });
// go.Shape.defineFigureGenerator('File', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0, true); // starting point
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.75 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.25 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h).close());
//     const fig2 = new go.PathFigure(0.75 * w, 0, false);
//     geo.add(fig2);
//     // The Fold
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.75 * w, 0.25 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w, 0.25 * h));
//     geo.spot1 = new go.Spot(0, 0.25);
//     geo.spot2 = go.Spot.BottomRight;
//     return geo;
// });
// go.Shape.defineFigureGenerator('Interrupt', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(w, 0.5 * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h));
//     const fig2 = new go.PathFigure(w, 0.5 * h, false);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     const fig3 = new go.PathFigure(w, 0.5 * h, false);
//     geo.add(fig3);
//     fig3.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     geo.spot1 = new go.Spot(0, 0.25);
//     geo.spot2 = new go.Spot(0.5, 0.75);
//     return geo;
// });
// go.Shape.defineFigureGenerator('InternalStorage', (shape, w, h) => {
//     const geo = new go.Geometry();
//     let param1 = shape ? shape.parameter1 : NaN;
//     let param2 = shape ? shape.parameter2 : NaN;
//     if (isNaN(param1))
//         param1 = 0.1; // Distance from left
//     if (isNaN(param2))
//         param2 = 0.1; // Distance from top
//     const fig = new go.PathFigure(0, 0, true);
//     geo.add(fig);
//     // The main body
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h).close());
//     const fig2 = new go.PathFigure(param1 * w, 0, false);
//     geo.add(fig2);
//     // Two lines
//     fig2.add(new go.PathSegment(go.SegmentType.Line, param1 * w, h));
//     fig2.add(new go.PathSegment(go.SegmentType.Move, 0, param2 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w, param2 * h));
//     // ??? geo.spot1 = new go.Spot(param1, param2);
//     // ??? geo.spot2 = go.Spot.BottomRight;
//     return geo;
// });
// go.Shape.defineFigureGenerator('Junction', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const dist = 1 / Math.SQRT2;
//     const small = (1 - 1 / Math.SQRT2) / 2;
//     const cpOffset = KAPPA * 0.5;
//     const radius = 0.5;
//     const fig = new go.PathFigure(w, radius * h, true);
//     geo.add(fig);
//     // Circle
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, radius * w, h, w, (radius + cpOffset) * h, (radius + cpOffset) * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, radius * h, (radius - cpOffset) * w, h, 0, (radius + cpOffset) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, radius * w, 0, 0, (radius - cpOffset) * h, (radius - cpOffset) * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, w, radius * h, (radius + cpOffset) * w, 0, w, (radius - cpOffset) * h));
//     const fig2 = new go.PathFigure((small + dist) * w, (small + dist) * h, false);
//     geo.add(fig2);
//     // X
//     fig2.add(new go.PathSegment(go.SegmentType.Line, small * w, small * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Move, small * w, (small + dist) * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, (small + dist) * w, small * h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('LinedDocument', (shape, w, h) => {
//     const geo = new go.Geometry();
//     h = h / 0.8;
//     const fig = new go.PathFigure(0, 0.7 * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.7 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, 0.7 * h, 0.5 * w, 0.4 * h, 0.5 * w, h).close());
//     const fig2 = new go.PathFigure(0.1 * w, 0, false);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.1 * w, 0.75 * h));
//     geo.spot1 = new go.Spot(0.1, 0);
//     geo.spot2 = new go.Spot(1, 0.6);
//     return geo;
// });
// go.Shape.defineFigureGenerator('LoopLimit', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.25 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.25 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.75 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.25 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h).close());
//     geo.spot1 = new go.Spot(0, 0.25);
//     geo.spot2 = go.Spot.BottomRight;
//     return geo;
// });
go.Shape.defineFigureGenerator('MagneticTape', (shape, w, h) => {
    const geo = new go.Geometry();
    const cpOffset = KAPPA * 0.5;
    const radius = 0.5;
    const fig = new go.PathFigure(0.5 * w, h, true);
    geo.add(fig);
    fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, radius * h, (radius - cpOffset) * w, h, 0, (radius + cpOffset) * h));
    fig.add(new go.PathSegment(go.SegmentType.Bezier, radius * w, 0, 0, (radius - cpOffset) * h, (radius - cpOffset) * w, 0));
    fig.add(new go.PathSegment(go.SegmentType.Bezier, w, radius * h, (radius + cpOffset) * w, 0, w, (radius - cpOffset) * h));
    fig.add(new go.PathSegment(go.SegmentType.Bezier, (radius + 0.1) * w, 0.9 * h, w, (radius + cpOffset) * h, (radius + cpOffset) * w, 0.9 * h));
    fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.9 * h));
    fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, h));
    geo.spot1 = new go.Spot(0.15, 0.15);
    geo.spot2 = new go.Spot(0.85, 0.8);
    return geo;
});
go.Shape.defineFigureGenerator('ManualInput', (shape, w, h) => {
    const geo = new go.Geometry();
    const fig = new go.PathFigure(w, 0, true);
    geo.add(fig);
    fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.25 * h).close());
    geo.spot1 = new go.Spot(0, 0.25);
    geo.spot2 = go.Spot.BottomRight;
    return geo;
});
// go.Shape.defineFigureGenerator('MessageFromUser', (shape, w, h) => {
//     const geo = new go.Geometry();
//     let param1 = shape ? shape.parameter1 : NaN;
//     if (isNaN(param1))
//         param1 = 0.7; // How far from the right the point is
//     const fig = new go.PathFigure(0, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, param1 * w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h).close());
//     geo.spot1 = go.Spot.TopLeft;
//     // ??? geo.spot2 = new go.Spot(param1, 1);
//     return geo;
// });
// go.Shape.defineFigureGenerator('MicroformProcessing', (shape, w, h) => {
//     const geo = new go.Geometry();
//     let param1 = shape ? shape.parameter1 : NaN;
//     if (isNaN(param1))
//         param1 = 0.25; // How far from the top/bottom the points are
//     const fig = new go.PathFigure(0, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, param1 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, (1 - param1) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h).close());
//     // ??? geo.spot1 = new go.Spot(0, param1);
//     // ??? geo.spot2 = new go.Spot(1, 1 - param1);
//     return geo;
// });
// go.Shape.defineFigureGenerator('MicroformRecording', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.75 * w, 0.25 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.15 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.85 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.75 * w, 0.75 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h).close());
//     geo.spot1 = new go.Spot(0, 0.25);
//     geo.spot2 = new go.Spot(1, 0.75);
//     return geo;
// });
// go.Shape.defineFigureGenerator('MultiDocument', (shape, w, h) => {
//     const geo = new go.Geometry();
//     h = h / 0.8;
//     const fig = new go.PathFigure(w, 0, true);
//     geo.add(fig);
//     // Outline
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.9 * w, 0.44 * h, 0.96 * w, 0.47 * h, 0.93 * w, 0.45 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.9 * w, 0.6 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.8 * w, 0.54 * h, 0.86 * w, 0.57 * h, 0.83 * w, 0.55 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, 0.7 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, 0.7 * h, 0.4 * w, 0.4 * h, 0.4 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.2 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.1 * w, 0.2 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.1 * w, 0.1 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, 0.1 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, 0).close());
//     const fig2 = new go.PathFigure(0.1 * w, 0.2 * h, false);
//     geo.add(fig2);
//     // Inside lines
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, 0.2 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, 0.54 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Move, 0.2 * w, 0.1 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.9 * w, 0.1 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.9 * w, 0.44 * h));
//     geo.spot1 = new go.Spot(0, 0.25);
//     geo.spot2 = new go.Spot(0.8, 0.77);
//     return geo;
// });
// go.Shape.defineFigureGenerator('MultiProcess', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0.1 * w, 0.1 * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, 0.1 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.8 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.9 * w, 0.8 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.9 * w, 0.9 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, 0.9 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.2 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.1 * w, 0.2 * h).close());
//     const fig2 = new go.PathFigure(0.2 * w, 0.1 * h, false);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.9 * w, 0.1 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.9 * w, 0.8 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Move, 0.1 * w, 0.2 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, 0.2 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, 0.9 * h));
//     geo.spot1 = new go.Spot(0, 0.2);
//     geo.spot2 = new go.Spot(0.8, 1);
//     return geo;
// });
// go.Shape.defineFigureGenerator('OfflineStorage', (shape, w, h) => {
//     const geo = new go.Geometry();
//     let param1 = shape ? shape.parameter1 : NaN;
//     if (isNaN(param1))
//         param1 = 0.1; // Distance between 2 top lines
//     const fig = new go.PathFigure(0, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, h).close());
//     const fig2 = new go.PathFigure(0.5 * param1 * w, param1 * h, false);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Line, (1 - 0.5 * param1) * w, param1 * h));
//     // ??? geo.spot1 = new go.Spot(l / 4 + .5 * param1, param1);
//     // ??? geo.spot2 = new go.Spot(3 * l / 4 + .5 * param1, param1 + .5 * l);
//     return geo;
// });
// go.Shape.defineFigureGenerator('OffPageConnector', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.75 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.75 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h).close());
//     geo.spot1 = go.Spot.TopLeft;
//     geo.spot2 = new go.Spot(0.75, 1);
//     return geo;
// });
// go.Shape.defineFigureGenerator('Or', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const cpOffset = KAPPA * 0.5;
//     const radius = 0.5;
//     const fig = new go.PathFigure(w, radius * h, true);
//     geo.add(fig);
//     // Circle
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, radius * w, h, w, (radius + cpOffset) * h, (radius + cpOffset) * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, radius * h, (radius - cpOffset) * w, h, 0, (radius + cpOffset) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, radius * w, 0, 0, (radius - cpOffset) * h, (radius - cpOffset) * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, w, radius * h, (radius + cpOffset) * w, 0, w, (radius - cpOffset) * h));
//     const fig2 = new go.PathFigure(w, 0.5 * h, false);
//     geo.add(fig2);
//     // +
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0, 0.5 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Move, 0.5 * w, h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0));
//     return geo;
// });
// go.Shape.defineFigureGenerator('PaperTape', (shape, w, h) => {
//     const geo = new go.Geometry();
//     h = h / 0.8;
//     const fig = new go.PathFigure(0, 0.7 * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.3 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, w, 0.3 * h, 0.5 * w, 0.6 * h, 0.5 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.7 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, 0.7 * h, 0.5 * w, 0.4 * h, 0.5 * w, h).close());
//     geo.spot1 = new go.Spot(0, 0.49);
//     geo.spot2 = new go.Spot(1, 0.75);
//     return geo;
// });
// go.Shape.defineFigureGenerator('PrimitiveFromCall', (shape, w, h) => {
//     const geo = new go.Geometry();
//     let param1 = shape ? shape.parameter1 : NaN;
//     let param2 = shape ? shape.parameter2 : NaN;
//     if (isNaN(param1))
//         param1 = 0.1; // Distance of left line from left
//     if (isNaN(param2))
//         param2 = 0.3; // Distance of point from right
//     const fig = new go.PathFigure(0, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, (1 - param2) * w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h).close());
//     // ??? geo.spot1 = new go.Spot(param1, 0);
//     // ??? geo.spot2 = new go.Spot(1 - param2, 1);
//     return geo;
// });
// go.Shape.defineFigureGenerator('PrimitiveToCall', (shape, w, h) => {
//     const geo = new go.Geometry();
//     let param1 = shape ? shape.parameter1 : NaN;
//     let param2 = shape ? shape.parameter2 : NaN;
//     if (isNaN(param1))
//         param1 = 0.1; // Distance of left line from left
//     if (isNaN(param2))
//         param2 = 0.3; // Distance of top and bottom right corners from right
//     const fig = new go.PathFigure(0, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, (1 - param2) * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, (1 - param2) * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h).close());
//     // ??? geo.spot1 = new go.Spot(param1, 0);
//     // ??? geo.spot2 = new go.Spot(1 - param2, 1);
//     return geo;
// });
// go.Shape.defineFigureGenerator('Procedure', (shape, w, h) => {
//     const geo = new go.Geometry();
//     let param1 = shape ? shape.parameter1 : NaN;
//     // Distance of left  and right lines from edge
//     if (isNaN(param1))
//         param1 = 0.1;
//     const fig = new go.PathFigure(0, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h).close());
//     const fig2 = new go.PathFigure((1 - param1) * w, 0, false);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Line, (1 - param1) * w, h));
//     fig2.add(new go.PathSegment(go.SegmentType.Move, param1 * w, 0));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, param1 * w, h));
//     // ??? geo.spot1 = new go.Spot(param1, 0);
//     // ??? geo.spot2 = new go.Spot(1 - param1, 1);
//     return geo;
// });
// go.Shape.defineFigureGenerator('Process', (shape, w, h) => {
//     const geo = new go.Geometry();
//     let param1 = shape ? shape.parameter1 : NaN;
//     if (isNaN(param1))
//         param1 = 0.1; // Distance of left  line from left edge
//     const fig = new go.PathFigure(0, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h).close());
//     const fig2 = new go.PathFigure(param1 * w, 0, false);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Line, param1 * w, h));
//     // ??? geo.spot1 = new go.Spot(param1, 0);
//     geo.spot2 = go.Spot.BottomRight;
//     return geo;
// });
// go.Shape.defineFigureGenerator('Sort', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0.5 * w, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.5 * h).close());
//     const fig2 = new go.PathFigure(0, 0.5 * h, false);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h));
//     geo.spot1 = new go.Spot(0.25, 0.25);
//     geo.spot2 = new go.Spot(0.75, 0.5);
//     return geo;
// });


go.Shape.defineFigureGenerator('InputNode', (shape, w, h) => {


    const geo = new go.Geometry();
    const cpOffset = KAPPA * 0.5;
    const fig = new go.PathFigure(0, 0, true);
    geo.add(fig);
    // The gate body
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0));
    fig.add(new go.PathSegment(go.SegmentType.Bezier, w, 0.5 * h, (0.5 + cpOffset) * w, 0, w, (0.5 - cpOffset) * h));
    fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, h, w, (0.5 + cpOffset) * h, (0.5 + cpOffset) * w, h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0, h).close());
    geo.spot1 = go.Spot.TopLeft;
    geo.spot2 = new go.Spot(0.55, 1);
    return geo;

});

go.Shape.defineFigureGenerator('Start', (shape, w, h) => {
    const geo = new go.Geometry();
    let param1 = shape ? shape.parameter1 : NaN;
    if (isNaN(param1))
        param1 = 0.25;
    const fig = new go.PathFigure(param1 * w, 0, true);
    geo.add(fig);
    fig.add(new go.PathSegment(go.SegmentType.Arc, 270, 180, 0.75 * w, 0.5 * h, 0.25 * w, 0.5 * h));
    fig.add(new go.PathSegment(go.SegmentType.Arc, 90, 180, 0.25 * w, 0.5 * h, 0.25 * w, 0.5 * h));
    const fig2 = new go.PathFigure(param1 * w, 0, false);
    geo.add(fig2);
    fig2.add(new go.PathSegment(go.SegmentType.Line, param1 * w, h));
    fig2.add(new go.PathSegment(go.SegmentType.Move, (1 - param1) * w, 0));
    fig2.add(new go.PathSegment(go.SegmentType.Line, (1 - param1) * w, h));
    geo.spot1 = new go.Spot(param1, 0);
    geo.spot2 = new go.Spot(1 - param1, 1);
    return geo;
});
go.Shape.defineFigureGenerator('Terminator', (shape, w, h) => {
    const geo = new go.Geometry();
    const fig = new go.PathFigure(0.25 * w, 0, true);
    geo.add(fig);
    fig.add(new go.PathSegment(go.SegmentType.Arc, 270, 180, 0.75 * w, 0.5 * h, 0.25 * w, 0.5 * h));
    fig.add(new go.PathSegment(go.SegmentType.Arc, 90, 180, 0.25 * w, 0.5 * h, 0.25 * w, 0.5 * h));
    geo.spot1 = new go.Spot(0.23, 0);
    geo.spot2 = new go.Spot(0.77, 1);
    return geo;
});
go.Shape.defineFigureGenerator('TransmittalTape', (shape, w, h) => {
    const geo = new go.Geometry();
    let param1 = shape ? shape.parameter1 : NaN;
    if (isNaN(param1))
        param1 = 0.1; // Bottom line's distance from the point on the triangle
    const fig = new go.PathFigure(0, 0, true);
    geo.add(fig);
    fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
    fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.75 * w, (1 - param1) * h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0, (1 - param1) * h).close());
    geo.spot1 = go.Spot.TopLeft;
    // ??? geo.spot2 = new go.Spot(1, 1 - param1);
    return geo;
});

go.Shape.defineFigureGenerator('InputTemplate', (shape, w, h) => {
    const geo = new go.Geometry();
    const cpOffset = KAPPA * 0.5;
    const fig = new go.PathFigure(0, 0, true);
    geo.add(fig);
    // The gate body





    fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, 0));
    fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h, (0.5 + cpOffset) * w, 0, w, (0.5 - cpOffset) * h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, h, w, (0.5 + cpOffset) * h, (0.5 + cpOffset) * w, h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0, h).close());
    geo.spot1 = new go.Spot(1, 0.5);
    return geo;
});

go.Shape.defineFigureGenerator('OutputTemplate', (shape, w, h) => {



    const geo = new go.Geometry();
    const radius = 0.5;
    const cpOffset = KAPPA * radius;
    const centerx = 0;
    const centery = 0.5;
    const fig = new go.PathFigure(0, 0, true);
    geo.add(fig);
    fig.add(new go.PathSegment(go.SegmentType.Bezier, w, 0.5 * h, (centerx + cpOffset + cpOffset) * w, (centery - radius) * h, 0.8 * w, (centery - cpOffset) * h));
    fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, h, 0.8 * w, (centery + cpOffset) * h, (centerx + cpOffset + cpOffset) * w, (centery + radius) * h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0, 0.25 * w, 0.75 * h, 0.25 * w, 0.25 * h).close());
    geo.spot1 = new go.Spot(0, 0.5);

    return geo;
});

go.Shape.defineFigureGenerator('AndGate', (shape, w, h) => {
    const geo = new go.Geometry();
    const cpOffset = KAPPA * 0.5;
    const fig = new go.PathFigure(0, 0, true);
    geo.add(fig);
    // The gate body
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0));
    fig.add(new go.PathSegment(go.SegmentType.Bezier, w, 0.5 * h, (0.5 + cpOffset) * w, 0, w, (0.5 - cpOffset) * h));
    fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, h, w, (0.5 + cpOffset) * h, (0.5 + cpOffset) * w, h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0, h).close());
    geo.spot1 = go.Spot.TopLeft;
    geo.spot2 = new go.Spot(0.55, 1);
    return geo;
});
go.Shape.defineFigureGenerator('Buffer', (shape, w, h) => {
    const geo = new go.Geometry();
    const fig = new go.PathFigure(0, 0, true);
    geo.add(fig);
    fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0, h).close());
    geo.spot1 = new go.Spot(0, 0.25);
    geo.spot2 = new go.Spot(0.5, 0.75);
    return geo;
});
go.Shape.defineFigureGenerator('Clock', (shape, w, h) => {
    const geo = new go.Geometry();
    const cpOffset = KAPPA * 0.5;
    const radius = 0.5;
    const fig = new go.PathFigure(w, radius * h, true);
    geo.add(fig);
    // Ellipse
    fig.add(new go.PathSegment(go.SegmentType.Bezier, radius * w, h, w, (radius + cpOffset) * h, (radius + cpOffset) * w, h));
    fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, radius * h, (radius - cpOffset) * w, h, 0, (radius + cpOffset) * h));
    fig.add(new go.PathSegment(go.SegmentType.Bezier, radius * w, 0, 0, (radius - cpOffset) * h, (radius - cpOffset) * w, 0));
    fig.add(new go.PathSegment(go.SegmentType.Bezier, w, radius * h, (radius + cpOffset) * w, 0, w, (radius - cpOffset) * h));
    const fig2 = new go.PathFigure(w, radius * h, false);
    geo.add(fig2);
    fig2.add(new go.PathSegment(go.SegmentType.Line, w, radius * h));
    const fig3 = new go.PathFigure(0.8 * w, 0.75 * h, false);
    geo.add(fig3);
    // Inside clock
    // This first line solves a GDI+ graphical error with
    // more complex gradient brushes
    fig3.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, 0.25 * h));
    fig3.add(new go.PathSegment(go.SegmentType.Line, 0.6 * w, 0.25 * h));
    fig3.add(new go.PathSegment(go.SegmentType.Line, 0.6 * w, 0.75 * h));
    fig3.add(new go.PathSegment(go.SegmentType.Line, 0.4 * w, 0.75 * h));
    fig3.add(new go.PathSegment(go.SegmentType.Line, 0.4 * w, 0.25 * h));
    fig3.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, 0.25 * h));
    fig3.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, 0.75 * h));
    return geo;
});
go.Shape.defineFigureGenerator('Ground', (shape, w, h) => {
    const geo = new go.Geometry();
    const fig = new go.PathFigure(0.5 * w, 0, false);
    geo.add(fig);
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.4 * h));
    fig.add(new go.PathSegment(go.SegmentType.Move, 0.2 * w, 0.6 * h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, 0.6 * h));
    fig.add(new go.PathSegment(go.SegmentType.Move, 0.3 * w, 0.8 * h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, 0.8 * h));
    fig.add(new go.PathSegment(go.SegmentType.Move, 0.4 * w, h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.6 * w, h));
    return geo;
});
go.Shape.defineFigureGenerator('Inverter', (shape, w, h) => {
    const geo = new go.Geometry();
    const cpOffset = KAPPA * 0.1;
    const radius = 0.1;
    const centerx = 0.9;
    const centery = 0.5;
    const fig = new go.PathFigure(0.8 * w, 0.5 * h, true);
    geo.add(fig);
    fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, 0.5 * h));
    const fig2 = new go.PathFigure((centerx + radius) * w, centery * h, true);
    geo.add(fig2);
    fig2.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery + radius) * h, (centerx + radius) * w, (centery + cpOffset) * h, (centerx + cpOffset) * w, (centery + radius) * h));
    fig2.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius) * w, centery * h, (centerx - cpOffset) * w, (centery + radius) * h, (centerx - radius) * w, (centery + cpOffset) * h));
    fig2.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery - radius) * h, (centerx - radius) * w, (centery - cpOffset) * h, (centerx - cpOffset) * w, (centery - radius) * h));
    fig2.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w, centery * h, (centerx + cpOffset) * w, (centery - radius) * h, (centerx + radius) * w, (centery - cpOffset) * h));
    geo.spot1 = new go.Spot(0, 0.25);
    geo.spot2 = new go.Spot(0.4, 0.75);
    return geo;
});
go.Shape.defineFigureGenerator('NandGate', (shape, w, h) => {
    const geo = new go.Geometry();
    const cpxOffset = KAPPA * 0.5;
    const cpyOffset = KAPPA * 0.4;
    const cpOffset = KAPPA * 0.1;
    const radius = 0.1;
    const centerx = 0.9;
    const centery = 0.5;
    const fig = new go.PathFigure(0.8 * w, 0.5 * h, true);
    geo.add(fig);
    // The gate body
    fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.4 * w, h, 0.8 * w, (0.5 + cpyOffset) * h, (0.4 + cpxOffset) * w, h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.4 * w, 0));
    fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.8 * w, 0.5 * h, (0.4 + cpxOffset) * w, 0, 0.8 * w, (0.5 - cpyOffset) * h));
    const fig2 = new go.PathFigure((centerx + radius) * w, centery * h, true);
    geo.add(fig2);
    // Inversion
    fig2.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery + radius) * h, (centerx + radius) * w, (centery + cpOffset) * h, (centerx + cpOffset) * w, (centery + radius) * h));
    fig2.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius) * w, centery * h, (centerx - cpOffset) * w, (centery + radius) * h, (centerx - radius) * w, (centery + cpOffset) * h));
    fig2.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery - radius) * h, (centerx - radius) * w, (centery - cpOffset) * h, (centerx - cpOffset) * w, (centery - radius) * h));
    fig2.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w, centery * h, (centerx + cpOffset) * w, (centery - radius) * h, (centerx + radius) * w, (centery - cpOffset) * h));
    geo.spot1 = new go.Spot(0, 0.05);
    geo.spot2 = new go.Spot(0.55, 0.95);
    return geo;
});
go.Shape.defineFigureGenerator('NorGate', (shape, w, h) => {
    const geo = new go.Geometry();
    let radius = 0.5;
    let cpOffset = KAPPA * radius;
    let centerx = 0;
    let centery = 0.5;
    const fig = new go.PathFigure(0.8 * w, 0.5 * h, true);
    geo.add(fig);
    // Normal
    fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, h, 0.7 * w, (centery + cpOffset) * h, (centerx + cpOffset) * w, (centery + radius) * h));
    fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, 0, 0.25 * w, 0.75 * h, 0.25 * w, 0.25 * h));
    fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.8 * w, 0.5 * h, (centerx + cpOffset) * w, (centery - radius) * h, 0.7 * w, (centery - cpOffset) * h));
    radius = 0.1;
    cpOffset = KAPPA * 0.1;
    centerx = 0.9;
    centery = 0.5;
    const fig2 = new go.PathFigure((centerx - radius) * w, centery * h, true);
    geo.add(fig2);
    // Inversion
    fig2.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery - radius) * h, (centerx - radius) * w, (centery - cpOffset) * h, (centerx - cpOffset) * w, (centery - radius) * h));
    fig2.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w, centery * h, (centerx + cpOffset) * w, (centery - radius) * h, (centerx + radius) * w, (centery - cpOffset) * h));
    fig2.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery + radius) * h, (centerx + radius) * w, (centery + cpOffset) * h, (centerx + cpOffset) * w, (centery + radius) * h));
    fig2.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius) * w, centery * h, (centerx - cpOffset) * w, (centery + radius) * h, (centerx - radius) * w, (centery + cpOffset) * h));
    geo.spot1 = new go.Spot(0.2, 0.25);
    geo.spot2 = new go.Spot(0.6, 0.75);
    return geo;
});
go.Shape.defineFigureGenerator('OrGate', (shape, w, h) => {
    const geo = new go.Geometry();
    const radius = 0.5;
    const cpOffset = KAPPA * radius;
    const centerx = 0;
    const centery = 0.5;
    const fig = new go.PathFigure(0, 0, true);
    geo.add(fig);
    fig.add(new go.PathSegment(go.SegmentType.Bezier, w, 0.5 * h, (centerx + cpOffset + cpOffset) * w, (centery - radius) * h, 0.8 * w, (centery - cpOffset) * h));
    fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, h, 0.8 * w, (centery + cpOffset) * h, (centerx + cpOffset + cpOffset) * w, (centery + radius) * h));
    fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, 0, 0.25 * w, 0.75 * h, 0.25 * w, 0.25 * h).close());
    geo.spot1 = new go.Spot(0.2, 0.25);
    geo.spot2 = new go.Spot(0.75, 0.75);
    return geo;
});
go.Shape.defineFigureGenerator('XnorGate', (shape, w, h) => {
    const geo = new go.Geometry();
    let radius = 0.5;
    let cpOffset = KAPPA * radius;
    let centerx = 0.2;
    let centery = 0.5;
    const fig = new go.PathFigure(0.1 * w, 0, false);
    geo.add(fig);
    // Normal
    fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.1 * w, h, 0.35 * w, 0.25 * h, 0.35 * w, 0.75 * h));
    const fig2 = new go.PathFigure(0.8 * w, 0.5 * h, true);
    geo.add(fig2);
    fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0.2 * w, h, 0.7 * w, (centery + cpOffset) * h, (centerx + cpOffset) * w, (centery + radius) * h));
    fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0.2 * w, 0, 0.45 * w, 0.75 * h, 0.45 * w, 0.25 * h));
    fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0.8 * w, 0.5 * h, (centerx + cpOffset) * w, (centery - radius) * h, 0.7 * w, (centery - cpOffset) * h));
    radius = 0.1;
    cpOffset = KAPPA * 0.1;
    centerx = 0.9;
    centery = 0.5;
    const fig3 = new go.PathFigure((centerx - radius) * w, centery * h, true);
    geo.add(fig3);
    // Inversion
    fig3.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery - radius) * h, (centerx - radius) * w, (centery - cpOffset) * h, (centerx - cpOffset) * w, (centery - radius) * h));
    fig3.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w, centery * h, (centerx + cpOffset) * w, (centery - radius) * h, (centerx + radius) * w, (centery - cpOffset) * h));
    fig3.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery + radius) * h, (centerx + radius) * w, (centery + cpOffset) * h, (centerx + cpOffset) * w, (centery + radius) * h));
    fig3.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius) * w, centery * h, (centerx - cpOffset) * w, (centery + radius) * h, (centerx - radius) * w, (centery + cpOffset) * h));
    geo.spot1 = new go.Spot(0.4, 0.25);
    geo.spot2 = new go.Spot(0.65, 0.75);
    return geo;
});
go.Shape.defineFigureGenerator('XorGate', (shape, w, h) => {
    const geo = new go.Geometry();
    const radius = 0.5;
    const cpOffset = KAPPA * radius;
    const centerx = 0.2;
    const centery = 0.5;
    const fig = new go.PathFigure(0.1 * w, 0, false);
    geo.add(fig);
    fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.1 * w, h, 0.35 * w, 0.25 * h, 0.35 * w, 0.75 * h));
    const fig2 = new go.PathFigure(0.2 * w, 0, true);
    geo.add(fig2);
    fig2.add(new go.PathSegment(go.SegmentType.Bezier, w, 0.5 * h, (centerx + cpOffset) * w, (centery - radius) * h, 0.9 * w, (centery - cpOffset) * h));
    fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0.2 * w, h, 0.9 * w, (centery + cpOffset) * h, (centerx + cpOffset) * w, (centery + radius) * h));
    fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0.2 * w, 0, 0.45 * w, 0.75 * h, 0.45 * w, 0.25 * h).close());
    geo.spot1 = new go.Spot(0.4, 0.25);
    geo.spot2 = new go.Spot(0.8, 0.75);
    return geo;
});
go.Shape.defineFigureGenerator('Capacitor', (shape, w, h) => {
    const geo = new go.Geometry();
    const fig = new go.PathFigure(0, 0, false);
    geo.add(fig);
    // Two vertical lines
    fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
    fig.add(new go.PathSegment(go.SegmentType.Move, w, 0));
    fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
    return geo;
});
go.Shape.defineFigureGenerator('Resistor', (shape, w, h) => {
    const geo = new go.Geometry();
    const fig = new go.PathFigure(0, 0.5 * h, false);
    geo.add(fig);
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.1 * w, 0));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.3 * w, 0));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.4 * w, h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.6 * w, h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, 0.5 * h));
    return geo;
});
// go.Shape.defineFigureGenerator('Inductor', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const cpOffset = KAPPA * 0.1;
//     const radius = 0.1;
//     let centerx = 0.1;
//     // Up
//     const fig = new go.PathFigure((centerx - cpOffset * 0.5) * w, h, false);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w, 0, (centerx - cpOffset) * w, h, (centerx - radius) * w, 0));
//     // Down up
//     centerx = 0.3;
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, h, (centerx + radius) * w, 0, (centerx + cpOffset) * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w, 0, (centerx - cpOffset) * w, h, (centerx - radius) * w, 0));
//     // Down up
//     centerx = 0.5;
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, h, (centerx + radius) * w, 0, (centerx + cpOffset) * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w, 0, (centerx - cpOffset) * w, h, (centerx - radius) * w, 0));
//     // Down up
//     centerx = 0.7;
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, h, (centerx + radius) * w, 0, (centerx + cpOffset) * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w, 0, (centerx - cpOffset) * w, h, (centerx - radius) * w, 0));
//     // Down up
//     centerx = 0.9;
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + cpOffset * 0.5) * w, h, (centerx + radius) * w, 0, (centerx + cpOffset) * w, h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('ACvoltageSource', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const cpOffset = KAPPA * 0.5;
//     const radius = 0.5;
//     const centerx = 0.5;
//     const centery = 0.5;
//     const fig = new go.PathFigure((centerx - radius) * w, centery * h, false);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery - radius) * h, (centerx - radius) * w, (centery - cpOffset) * h, (centerx - cpOffset) * w, (centery - radius) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w, centery * h, (centerx + cpOffset) * w, (centery - radius) * h, (centerx + radius) * w, (centery - cpOffset) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery + radius) * h, (centerx + radius) * w, (centery + cpOffset) * h, (centerx + cpOffset) * w, (centery + radius) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius) * w, centery * h, (centerx - cpOffset) * w, (centery + radius) * h, (centerx - radius) * w, (centery + cpOffset) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Move, (centerx - radius + 0.1) * w, centery * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius - 0.1) * w, centery * h, centerx * w, (centery - radius) * h, centerx * w, (centery + radius) * h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('DCvoltageSource', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0.75 * h, false);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.25 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Move, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('Diode', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(w, 0, false);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     geo.spot1 = new go.Spot(0, 0.25);
//     geo.spot2 = new go.Spot(0.5, 0.75);
//     return geo;
// });
// go.Shape.defineFigureGenerator('Wifi', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const origw = w;
//     const origh = h;
//     w = w * 0.38;
//     h = h * 0.6;
//     let cpOffset = KAPPA * 0.8;
//     let radius = 0.8;
//     let centerx = 0;
//     let centery = 0.5;
//     const xOffset = (origw - w) / 2;
//     const yOffset = (origh - h) / 2;
//     const fig = new go.PathFigure(centerx * w + xOffset, (centery + radius) * h + yOffset, true);
//     geo.add(fig);
//     // Left curves
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius) * w + xOffset, centery * h + yOffset, (centerx - cpOffset) * w + xOffset, (centery + radius) * h + yOffset, (centerx - radius) * w + xOffset, (centery + cpOffset) * h + yOffset));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w + xOffset, (centery - radius) * h + yOffset, (centerx - radius) * w + xOffset, (centery - cpOffset) * h + yOffset, (centerx - cpOffset) * w + xOffset, (centery - radius) * h + yOffset));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius + cpOffset * 0.5) * w + xOffset, centery * h + yOffset, centerx * w + xOffset, (centery - radius) * h + yOffset, (centerx - radius + cpOffset * 0.5) * w + xOffset, (centery - cpOffset) * h + yOffset));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w + xOffset, (centery + radius) * h + yOffset, (centerx - radius + cpOffset * 0.5) * w + xOffset, (centery + cpOffset) * h + yOffset, centerx * w + xOffset, (centery + radius) * h + yOffset).close());
//     cpOffset = KAPPA * 0.4;
//     radius = 0.4;
//     centerx = 0.2;
//     centery = 0.5;
//     const fig2 = new go.PathFigure(centerx * w + xOffset, (centery + radius) * h + yOffset, true);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius) * w + xOffset, centery * h + yOffset, (centerx - cpOffset) * w + xOffset, (centery + radius) * h + yOffset, (centerx - radius) * w + xOffset, (centery + cpOffset) * h + yOffset));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w + xOffset, (centery - radius) * h + yOffset, (centerx - radius) * w + xOffset, (centery - cpOffset) * h + yOffset, (centerx - cpOffset) * w + xOffset, (centery - radius) * h + yOffset));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius + cpOffset * 0.5) * w + xOffset, centery * h + yOffset, centerx * w + xOffset, (centery - radius) * h + yOffset, (centerx - radius + cpOffset * 0.5) * w + xOffset, (centery - cpOffset) * h + yOffset));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w + xOffset, (centery + radius) * h + yOffset, (centerx - radius + cpOffset * 0.5) * w + xOffset, (centery + cpOffset) * h + yOffset, centerx * w + xOffset, (centery + radius) * h + yOffset).close());
//     cpOffset = KAPPA * 0.2;
//     radius = 0.2;
//     centerx = 0.5;
//     centery = 0.5;
//     const fig3 = new go.PathFigure((centerx - radius) * w + xOffset, centery * h + yOffset, true);
//     geo.add(fig3);
//     // Center circle
//     fig3.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w + xOffset, (centery - radius) * h + yOffset, (centerx - radius) * w + xOffset, (centery - cpOffset) * h + yOffset, (centerx - cpOffset) * w + xOffset, (centery - radius) * h + yOffset));
//     fig3.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w + xOffset, centery * h + yOffset, (centerx + cpOffset) * w + xOffset, (centery - radius) * h + yOffset, (centerx + radius) * w + xOffset, (centery - cpOffset) * h + yOffset));
//     fig3.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w + xOffset, (centery + radius) * h + yOffset, (centerx + radius) * w + xOffset, (centery + cpOffset) * h + yOffset, (centerx + cpOffset) * w + xOffset, (centery + radius) * h + yOffset));
//     fig3.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius) * w + xOffset, centery * h + yOffset, (centerx - cpOffset) * w + xOffset, (centery + radius) * h + yOffset, (centerx - radius) * w + xOffset, (centery + cpOffset) * h + yOffset));
//     cpOffset = KAPPA * 0.4;
//     radius = 0.4;
//     centerx = 0.8;
//     centery = 0.5;
//     const fig4 = new go.PathFigure(centerx * w + xOffset, (centery - radius) * h + yOffset, true);
//     geo.add(fig4);
//     // Right curves
//     fig4.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w + xOffset, centery * h + yOffset, (centerx + cpOffset) * w + xOffset, (centery - radius) * h + yOffset, (centerx + radius) * w + xOffset, (centery - cpOffset) * h + yOffset));
//     fig4.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w + xOffset, (centery + radius) * h + yOffset, (centerx + radius) * w + xOffset, (centery + cpOffset) * h + yOffset, (centerx + cpOffset) * w + xOffset, (centery + radius) * h + yOffset));
//     fig4.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius - cpOffset * 0.5) * w + xOffset, centery * h + yOffset, centerx * w + xOffset, (centery + radius) * h + yOffset, (centerx + radius - cpOffset * 0.5) * w + xOffset, (centery + cpOffset) * h + yOffset));
//     fig4.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w + xOffset, (centery - radius) * h + yOffset, (centerx + radius - cpOffset * 0.5) * w + xOffset, (centery - cpOffset) * h + yOffset, centerx * w + xOffset, (centery - radius) * h + yOffset).close());
//     cpOffset = KAPPA * 0.8;
//     radius = 0.8;
//     centerx = 1;
//     centery = 0.5;
//     const fig5 = new go.PathFigure(centerx * w + xOffset, (centery - radius) * h + yOffset, true);
//     geo.add(fig5);
//     fig5.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w + xOffset, centery * h + yOffset, (centerx + cpOffset) * w + xOffset, (centery - radius) * h + yOffset, (centerx + radius) * w + xOffset, (centery - cpOffset) * h + yOffset));
//     fig5.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w + xOffset, (centery + radius) * h + yOffset, (centerx + radius) * w + xOffset, (centery + cpOffset) * h + yOffset, (centerx + cpOffset) * w + xOffset, (centery + radius) * h + yOffset));
//     fig5.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius - cpOffset * 0.5) * w + xOffset, centery * h + yOffset, centerx * w + xOffset, (centery + radius) * h + yOffset, (centerx + radius - cpOffset * 0.5) * w + xOffset, (centery + cpOffset) * h + yOffset));
//     fig5.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w + xOffset, (centery - radius) * h + yOffset, (centerx + radius - cpOffset * 0.5) * w + xOffset, (centery - cpOffset) * h + yOffset, centerx * w + xOffset, (centery - radius) * h + yOffset).close());
//     return geo;
// });
// go.Shape.defineFigureGenerator('Email', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0).close());
//     const fig2 = new go.PathFigure(0, 0, false);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.6 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig2.add(new go.PathSegment(go.SegmentType.Move, 0, h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.45 * w, 0.54 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Move, w, h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.55 * w, 0.54 * h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('Ethernet', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0.35 * w, 0, true);
//     geo.add(fig);
//     // Boxes above the wire
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.65 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.65 * w, 0.4 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.35 * w, 0.4 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.35 * w, 0).close());
//     const fig2 = new go.PathFigure(0.1 * w, h, true, true);
//     geo.add(fig2);
//     // Boxes under the wire
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.4 * w, h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.4 * w, 0.6 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.1 * w, 0.6 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.1 * w, h).close());
//     const fig3 = new go.PathFigure(0.6 * w, h, true, true);
//     geo.add(fig3);
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.9 * w, h));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.9 * w, 0.6 * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.6 * w, 0.6 * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.6 * w, h).close());
//     const fig4 = new go.PathFigure(0, 0.5 * h, false);
//     geo.add(fig4);
//     // Wire
//     fig4.add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h));
//     fig4.add(new go.PathSegment(go.SegmentType.Move, 0.5 * w, 0.5 * h));
//     fig4.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.4 * h));
//     fig4.add(new go.PathSegment(go.SegmentType.Move, 0.75 * w, 0.5 * h));
//     fig4.add(new go.PathSegment(go.SegmentType.Line, 0.75 * w, 0.6 * h));
//     fig4.add(new go.PathSegment(go.SegmentType.Move, 0.25 * w, 0.5 * h));
//     fig4.add(new go.PathSegment(go.SegmentType.Line, 0.25 * w, 0.6 * h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('Power', (shape, w, h) => {
//     const geo = new go.Geometry();
//     let cpOffset = KAPPA * 0.4;
//     let radius = 0.4;
//     const centerx = 0.5;
//     const centery = 0.5;
//     const unused = tempPoint();
//     const mid = tempPoint();
//     const c1 = tempPoint();
//     const c2 = tempPoint();
//     // Find the 45 degree midpoint for the first bezier
//     breakUpBezier(centerx, centery - radius, centerx + cpOffset, centery - radius, centerx + radius, centery - cpOffset, centerx + radius, centery, 0.5, unused, unused, mid, c1, c2);
//     const start = tempPointAt(mid.x, mid.y);
//     let fig = new go.PathFigure(mid.x * w, mid.y * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w, centery * h, c1.x * w, c1.y * h, c2.x * w, c2.y * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery + radius) * h, (centerx + radius) * w, (centery + cpOffset) * h, (centerx + cpOffset) * w, (centery + radius) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius) * w, centery * h, (centerx - cpOffset) * w, (centery + radius) * h, (centerx - radius) * w, (centery + cpOffset) * h));
//     // Find the 45 degree midpoint of for the fourth bezier
//     breakUpBezier(centerx - radius, centery, centerx - radius, centery - cpOffset, centerx - cpOffset, centery - radius, centerx, centery - radius, 0.5, c1, c2, mid, unused, unused);
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, mid.x * w, mid.y * h, c1.x * w, c1.y * h, c2.x * w, c2.y * h));
//     // now make a smaller circle
//     cpOffset = KAPPA * 0.3;
//     radius = 0.3;
//     // Find the 45 degree midpoint for the first bezier
//     breakUpBezier(centerx - radius, centery, centerx - radius, centery - cpOffset, centerx - cpOffset, centery - radius, centerx, centery - radius, 0.5, c1, c2, mid, unused, unused);
//     fig.add(new go.PathSegment(go.SegmentType.Line, mid.x * w, mid.y * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius) * w, centery * h, c2.x * w, c2.y * h, c1.x * w, c1.y * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery + radius) * h, (centerx - radius) * w, (centery + cpOffset) * h, (centerx - cpOffset) * w, (centery + radius) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w, centery * h, (centerx + cpOffset) * w, (centery + radius) * h, (centerx + radius) * w, (centery + cpOffset) * h));
//     // Find the 45 degree midpoint for the fourth bezier
//     breakUpBezier(centerx, centery - radius, centerx + cpOffset, centery - radius, centerx + radius, centery - cpOffset, centerx + radius, centery, 0.5, unused, unused, mid, c1, c2);
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, mid.x * w, mid.y * h, c2.x * w, c2.y * h, c1.x * w, c1.y * h).close());
//     fig = new go.PathFigure(0.45 * w, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.45 * w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.55 * w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.55 * w, 0).close());
//     freePoint(unused);
//     freePoint(mid);
//     freePoint(c1);
//     freePoint(c2);
//     freePoint(start);
//     geo.spot1 = new go.Spot(0.25, 0.45);
//     geo.spot2 = new go.Spot(0.75, 0.8);
//     return geo;
// });
// go.Shape.defineFigureGenerator('Fallout', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, h / 2, true);
//     geo.add(fig);
//     // Containing circle
//     fig.add(new go.PathSegment(go.SegmentType.Arc, 180, 360, w / 2, h / 2, w / 2, h / 2));
//     function drawTriangle(f, offsetx, offsety) {
//         f.add(new go.PathSegment(go.SegmentType.Move, (0.3 + offsetx) * w, (0.8 + offsety) * h));
//         f.add(new go.PathSegment(go.SegmentType.Line, (0.5 + offsetx) * w, (0.5 + offsety) * h));
//         f.add(new go.PathSegment(go.SegmentType.Line, (0.1 + offsetx) * w, (0.5 + offsety) * h));
//         f.add(new go.PathSegment(go.SegmentType.Line, (0.3 + offsetx) * w, (0.8 + offsety) * h).close());
//     }
//     // Triangles
//     drawTriangle(fig, 0, 0);
//     drawTriangle(fig, 0.4, 0);
//     drawTriangle(fig, 0.2, -0.3);
//     return geo;
// });
// go.Shape.defineFigureGenerator('IrritationHazard', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0.2 * w, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.3 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.2 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.8 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.7 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.8 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.3 * w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.2 * h).close());
//     geo.spot1 = new go.Spot(0.3, 0.3);
//     geo.spot2 = new go.Spot(0.7, 0.7);
//     return geo;
// });
// go.Shape.defineFigureGenerator('ElectricalHazard', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0.37 * w, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.11 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.77 * w, 0.04 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.33 * w, 0.49 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.37 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.63 * w, 0.86 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.77 * w, 0.91 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.34 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.34 * w, 0.78 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.44 * w, 0.8 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.65 * w, 0.56 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.68 * h).close());
//     return geo;
// });
// go.Shape.defineFigureGenerator('FireHazard', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0.1 * w, h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.29 * w, 0, -0.25 * w, 0.63 * h, 0.45 * w, 0.44 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.51 * w, 0.42 * h, 0.48 * w, 0.17 * h, 0.54 * w, 0.35 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.59 * w, 0.18 * h, 0.59 * w, 0.29 * h, 0.58 * w, 0.28 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.75 * w, 0.6 * h, 0.8 * w, 0.34 * h, 0.88 * w, 0.43 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.88 * w, 0.31 * h, 0.87 * w, 0.48 * h, 0.88 * w, 0.43 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.9 * w, h, 1.17 * w, 0.76 * h, 0.82 * w, 0.8 * h).close());
//     geo.spot1 = new go.Spot(0.07, 0.445);
//     geo.spot2 = new go.Spot(0.884, 0.958);
//     return geo;
// });
// go.Shape.defineFigureGenerator('BpmnActivityLoop', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const r = 0.5;
//     const cx = 0; // offset from Center x
//     const cy = 0; // offset from Center y
//     const d = r * KAPPA;
//     const mx1 = (0.4 * Math.SQRT2) / 2 + 0.5;
//     const my1 = 0.5 - (0.5 * Math.SQRT2) / 2;
//     const x1 = 1;
//     const y1 = 0.5;
//     const x2 = 0.5;
//     const y2 = 0;
//     const fig = new go.PathFigure(mx1 * w, (1 - my1) * h, false);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, x1 * w, y1 * h, x1 * w, 0.7 * h, x1 * w, y1 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (x2 + cx) * w, (y2 + cx) * h, (0.5 + r + cx) * w, (0.5 - d + cx) * h, (0.5 + d + cx) * w, (0.5 - r + cx) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (0.5 - r + cx) * w, (0.5 + cy) * h, (0.5 - d + cx) * w, (0.5 - r + cy) * h, (0.5 - r + cx) * w, (0.5 - d + cy) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (0.35 + cx) * w, 0.9 * h, (0.5 - r + cx) * w, (0.5 + d + cy) * h, (0.5 - d + cx) * w, 0.9 * h));
//     // Arrowhead
//     fig.add(new go.PathSegment(go.SegmentType.Move, (0.25 + cx) * w, 0.8 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, (0.35 + cx) * w, 0.9 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, (0.2 + cx) * w, 0.95 * h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('BpmnActivityParallel', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0, false);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
//     fig.add(new go.PathSegment(go.SegmentType.Move, 0.5 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Move, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('BpmnActivitySequential', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0, false);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Move, 0, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Move, 0, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('BpmnActivityAdHoc', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0, false);
//     geo.add(fig);
//     const fig2 = new go.PathFigure(w, h, false);
//     geo.add(fig2);
//     const fig3 = new go.PathFigure(0, 0.5 * h, false);
//     geo.add(fig3);
//     fig3.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 0.5 * h, 0.2 * w, 0.35 * h, 0.3 * w, 0.35 * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Bezier, w, 0.5 * h, 0.7 * w, 0.65 * h, 0.8 * w, 0.65 * h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('BpmnActivityCompensation', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0.5 * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, h).close());
//     return geo;
// });
// go.Shape.defineFigureGenerator('BpmnTaskMessage', (shape, w, h) => {
//     const geo = new go.Geometry();
//     let fig = new go.PathFigure(0, 0.2 * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.2 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.8 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.8 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.8 * h).close());
//     fig = new go.PathFigure(0, 0.2 * h, false);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.2 * h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('BpmnTaskScript', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0.7 * w, h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.3 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.3 * w, 0, 0.6 * w, 0.5 * h, 0, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.7 * w, h, 0.4 * w, 0.5 * h, w, 0.5 * h).close());
//     const fig2 = new go.PathFigure(0.45 * w, 0.73 * h, false);
//     geo.add(fig2);
//     // Lines on script
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, 0.73 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Move, 0.38 * w, 0.5 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.63 * w, 0.5 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Move, 0.31 * w, 0.27 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.56 * w, 0.27 * h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('BpmnTaskUser', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0, false);
//     geo.add(fig);
//     const fig2 = new go.PathFigure(0.335 * w, (1 - 0.555) * h, true);
//     geo.add(fig2);
//     // Shirt
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.335 * w, (1 - 0.405) * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, (1 - 0.335) * w, (1 - 0.405) * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, (1 - 0.335) * w, (1 - 0.555) * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, w, 0.68 * h, (1 - 0.12) * w, 0.46 * h, (1 - 0.02) * w, 0.54 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0, h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0, 0.68 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0.335 * w, (1 - 0.555) * h, 0.02 * w, 0.54 * h, 0.12 * w, 0.46 * h));
//     // Start of neck
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.365 * w, (1 - 0.595) * h));
//     const radiushead = 0.5 - 0.285;
//     const centerx = 0.5;
//     const centery = radiushead;
//     const alpha2 = Math.PI / 4;
//     const KAPPA2 = (4 * (1 - Math.cos(alpha2))) / (3 * Math.sin(alpha2));
//     const radiusw = radiushead;
//     const radiush = radiushead;
//     const offsetw = KAPPA2 * radiusw;
//     const offseth = KAPPA2 * radiush;
//     // Circle (head)
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radiusw) * w, centery * h, (centerx - (offsetw + radiusw) / 2) * w, (centery + (radiush + offseth) / 2) * h, (centerx - radiusw) * w, (centery + offseth) * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery - radiush) * h, (centerx - radiusw) * w, (centery - offseth) * h, (centerx - offsetw) * w, (centery - radiush) * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radiusw) * w, centery * h, (centerx + offsetw) * w, (centery - radiush) * h, (centerx + radiusw) * w, (centery - offseth) * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, (1 - 0.365) * w, (1 - 0.595) * h, (centerx + radiusw) * w, (centery + offseth) * h, (centerx + (offsetw + radiusw) / 2) * w, (centery + (radiush + offseth) / 2) * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, (1 - 0.365) * w, (1 - 0.595) * h));
//     // Neckline
//     fig2.add(new go.PathSegment(go.SegmentType.Line, (1 - 0.335) * w, (1 - 0.555) * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, (1 - 0.335) * w, (1 - 0.405) * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.335 * w, (1 - 0.405) * h));
//     const fig3 = new go.PathFigure(0.2 * w, h, false);
//     geo.add(fig3);
//     // Arm lines
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, 0.8 * h));
//     const fig4 = new go.PathFigure(0.8 * w, h, false);
//     geo.add(fig4);
//     fig4.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, 0.8 * h));
//     return geo;
// });
go.Shape.defineFigureGenerator('BpmnEventConditional', (shape, w, h) => {
    const geo = new go.Geometry();
    const fig = new go.PathFigure(0.1 * w, 0, true);
    geo.add(fig);
    // Body
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.9 * w, 0));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.9 * w, h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.1 * w, h).close());
    const fig2 = new go.PathFigure(0.2 * w, 0.2 * h, false);
    geo.add(fig2);
    // Inside lines
    fig2.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, 0.2 * h));
    fig2.add(new go.PathSegment(go.SegmentType.Move, 0.2 * w, 0.4 * h));
    fig2.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, 0.4 * h));
    fig2.add(new go.PathSegment(go.SegmentType.Move, 0.2 * w, 0.6 * h));
    fig2.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, 0.6 * h));
    fig2.add(new go.PathSegment(go.SegmentType.Move, 0.2 * w, 0.8 * h));
    fig2.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, 0.8 * h));
    return geo;
});
go.Shape.defineFigureGenerator('BpmnEventError', (shape, w, h) => {
    const geo = new go.Geometry();
    const fig = new go.PathFigure(0, h, true);
    geo.add(fig);
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.33 * w, 0));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.66 * w, 0.5 * h));
    fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.66 * w, h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.33 * w, 0.5 * h).close());
    return geo;
});
// go.Shape.defineFigureGenerator('BpmnEventEscalation', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0, false);
//     geo.add(fig);
//     // Set dimensions
//     const fig2 = new go.PathFigure(w, h, false);
//     geo.add(fig2);
//     const fig3 = new go.PathFigure(0.1 * w, h, true);
//     geo.add(fig3);
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.9 * w, h));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.5 * h).close());
//     return geo;
// });
// go.Shape.defineFigureGenerator('Caution', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0.05 * w, h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.1 * w, 0.8 * h, 0, h, 0, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.45 * w, 0.1 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.55 * w, 0.1 * h, 0.5 * w, 0, 0.5 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.95 * w, 0.9 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.9 * w, h, w, h, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.05 * w, h));
//     const radius = 0.05;
//     // Bottom circle of exclamation point
//     fig.add(new go.PathSegment(go.SegmentType.Move, (0.5 - radius) * w, 0.875 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Arc, 180, -360, 0.5 * w, 0.875 * h, radius * w, radius * h));
//     // Upper rectangle of exclamation point
//     fig.add(new go.PathSegment(go.SegmentType.Move, 0.5 * w, 0.75 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 0.325 * h, 0.575 * w, 0.725 * h, 0.625 * w, 0.375 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 0.75 * h, 0.375 * w, 0.375 * h, 0.425 * w, 0.725 * h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('Recycle', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0.45 * w, 0.95 * h, false);
//     geo.add(fig);
//     // Bottom left arrow
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, 0.95 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.185 * w, 0.85 * h, 0.17 * w, 0.95 * h, 0.15 * w, 0.9 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.235 * w, 0.75 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.3 * w, 0.625 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.35 * w, 0.65 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.275 * w, 0.45 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.05 * w, 0.45 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.1 * w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.05 * w, 0.575 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.1875 * w, 0.95 * h, 0, 0.675 * h, 0, 0.7 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Move, 0.45 * w, 0.95 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.45 * w, 0.775 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.22 * w, 0.775 * h));
//     const fig2 = new go.PathFigure(0.475 * w, 0.2 * h, false);
//     geo.add(fig2);
//     // Top arrow
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.4 * w, 0.4 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.225 * w, 0.3 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.275 * w, 0.175 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.325 * w, 0.05 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0.4 * w, 0.05 * h, 0.35 * w, 0, 0.375 * w, 0));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.575 * w, 0.375 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.525 * w, 0.4 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.75 * w, 0.475 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.85 * w, 0.315 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, 0.32 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.65 * w, 0.05 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0.575 * w, 0, 0.65 * w, 0.05 * h, 0.625 * w, 0));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.38 * w, 0.0105 * h));
//     const fig3 = new go.PathFigure(0.675 * w, 0.575 * h, false);
//     geo.add(fig3);
//     // Bottom right arrow
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.875 * w, 0.525 * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, w, 0.775 * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Bezier, 0.85 * w, 0.95 * h, w, 0.8 * h, w, 0.85 * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.65 * w, 0.95 * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.65 * w, h));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.55 * w, 0.85 * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.65 * w, 0.725 * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.65 * w, 0.775 * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, 0.775 * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, w, 0.775 * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Move, 0.675 * w, 0.575 * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.775 * w, 0.775 * h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('BpmnEventTimer', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const radius = 0.5;
//     const cpOffset = KAPPA * 0.5;
//     const fig = new go.PathFigure(w, radius * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, radius * w, h, w, (radius + cpOffset) * h, (radius + cpOffset) * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, radius * h, (radius - cpOffset) * w, h, 0, (radius + cpOffset) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, radius * w, 0, 0, (radius - cpOffset) * h, (radius - cpOffset) * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, w, radius * h, (radius + cpOffset) * w, 0, w, (radius - cpOffset) * h));
//     const fig2 = new go.PathFigure(radius * w, 0, false);
//     geo.add(fig2);
//     // Hour lines
//     fig2.add(new go.PathSegment(go.SegmentType.Line, radius * w, 0.15 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Move, radius * w, h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, radius * w, 0.85 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Move, 0, radius * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.15 * w, radius * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Move, w, radius * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.85 * w, radius * h));
//     // Clock hands
//     fig2.add(new go.PathSegment(go.SegmentType.Move, radius * w, radius * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.58 * w, 0.1 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Move, radius * w, radius * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.78 * w, 0.54 * h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('Package', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0.15 * h, true);
//     geo.add(fig);
//     // Package bottom rectangle
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.15 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h).close());
//     const fig2 = new go.PathFigure(0, 0.15 * h, true);
//     geo.add(fig2);
//     // Package top flap
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0, 0));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.6 * w, 0));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.65 * w, 0.15 * h).close());
//     geo.spot1 = new go.Spot(0, 0.1);
//     geo.spot2 = new go.Spot(1, 1);
//     return geo;
// });
// go.Shape.defineFigureGenerator('Class', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0, true);
//     geo.add(fig);
//     // Class box
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0).close());
//     const fig2 = new go.PathFigure(0, 0.2 * h, false);
//     geo.add(fig2);
//     // Top box separater
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w, 0.2 * h).close());
//     const fig3 = new go.PathFigure(0, 0.5 * h, false);
//     geo.add(fig3);
//     // Middle box separater
//     fig3.add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h).close());
//     return geo;
// });
// go.Shape.defineFigureGenerator('Component', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(w, h, true);
//     geo.add(fig);
//     // Component Box
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.15 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.15 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h).close());
//     const fig2 = new go.PathFigure(0, 0.2 * h, true);
//     geo.add(fig2);
//     // Component top sub box
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.45 * w, 0.2 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.45 * w, 0.4 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0, 0.4 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0, 0.2 * h).close());
//     const fig3 = new go.PathFigure(0, 0.6 * h, true);
//     geo.add(fig3);
//     // Component bottom sub box
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.45 * w, 0.6 * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.45 * w, 0.8 * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0, 0.8 * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0, 0.6 * h).close());
//     return geo;
// });
// go.Shape.defineFigureGenerator('Boat Shipment', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0.15 * w, 0.6 * h, true);
//     geo.add(fig);
//     // Boat shipment flag
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.15 * w, 0.6 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.6 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.15 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.85 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.6 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.85 * w, 0.6 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.15 * w, 0.6 * h));
//     const fig2 = new go.PathFigure(0.15 * w, 0.6 * h, false);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.85 * w, 0.6 * h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('Customer/Supplier', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(w, h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.66 * w, 0.33 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.66 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.33 * w, 0.33 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.33 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.33 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h).close());
//     return geo;
// });
go.Shape.defineFigureGenerator('Workcell', (shape, w, h) => {
    const geo = new go.Geometry();
    const fig = new go.PathFigure(0, h, true);
    geo.add(fig);
    fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0));
    fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
    fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.65 * w, h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.65 * w, 0.4 * h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.35 * w, 0.4 * h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.35 * w, h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0, h).close());
    return geo;
});
// go.Shape.defineFigureGenerator('Supermarket', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0, false);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.33 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.33 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Move, w, 0.33 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.66 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.66 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Move, w, 0.66 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('TruckShipment', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0, true);
//     geo.add(fig);
//     // Left rectangle
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.6 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.6 * w, 0.8 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.8 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0).close());
//     const fig2 = new go.PathFigure(w, 0.8 * h, true);
//     geo.add(fig2);
//     // Right rectangle
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w, 0.4 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.6 * w, 0.4 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.6 * w, 0.8 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w, 0.8 * h).close());
//     let radius = 0.1;
//     let cpOffset = KAPPA * 0.1;
//     let centerx = 0.2;
//     let centery = 0.9;
//     const fig3 = new go.PathFigure((centerx - radius) * w, centery * h, true);
//     geo.add(fig3);
//     // Left wheel
//     fig3.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery - radius) * h, (centerx - radius) * w, (centery - cpOffset) * h, (centerx - cpOffset) * w, (centery - radius) * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w, centery * h, (centerx + cpOffset) * w, (centery - radius) * h, (centerx + radius) * w, (centery - cpOffset) * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery + radius) * h, (centerx + radius) * w, (centery + cpOffset) * h, (centerx + cpOffset) * w, (centery + radius) * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius) * w, centery * h, (centerx - cpOffset) * w, (centery + radius) * h, (centerx - radius) * w, (centery + cpOffset) * h).close());
//     radius = 0.1;
//     cpOffset = KAPPA * 0.1;
//     centerx = 0.8;
//     centery = 0.9;
//     const fig4 = new go.PathFigure((centerx - radius) * w, centery * h, true);
//     geo.add(fig4);
//     // Right wheel
//     fig4.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery - radius) * h, (centerx - radius) * w, (centery - cpOffset) * h, (centerx - cpOffset) * w, (centery - radius) * h));
//     fig4.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w, centery * h, (centerx + cpOffset) * w, (centery - radius) * h, (centerx + radius) * w, (centery - cpOffset) * h));
//     fig4.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery + radius) * h, (centerx + radius) * w, (centery + cpOffset) * h, (centerx + cpOffset) * w, (centery + radius) * h));
//     fig4.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius) * w, centery * h, (centerx - cpOffset) * w, (centery + radius) * h, (centerx - radius) * w, (centery + cpOffset) * h).close());
//     return geo;
// });
// go.Shape.defineFigureGenerator('KanbanPost', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0.2 * w, 0, false);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Move, 0.5 * w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Move, 0.5 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('Forklift', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.4 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0));
//     const fig2 = new go.PathFigure(0, 0.5 * h, true);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0, 0.8 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.8 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.5 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0, 0.5 * h));
//     const fig3 = new go.PathFigure(0.5 * w, 0.8 * h, true);
//     geo.add(fig3);
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.1 * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.55 * w, 0.1 * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.55 * w, 0.8 * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.8 * h));
//     const fig4 = new go.PathFigure(0.5 * w, 0.7 * h, false);
//     geo.add(fig4);
//     fig4.add(new go.PathSegment(go.SegmentType.Line, w, 0.7 * h));
//     let radius = 0.1;
//     let cpOffset = KAPPA * 0.1;
//     let centerx = 0.1;
//     let centery = 0.9;
//     const fig5 = new go.PathFigure((centerx - radius) * w, centery * h, true);
//     geo.add(fig5);
//     fig5.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery - radius) * h, (centerx - radius) * w, (centery - cpOffset) * h, (centerx - cpOffset) * w, (centery - radius) * h));
//     fig5.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w, centery * h, (centerx + cpOffset) * w, (centery - radius) * h, (centerx + radius) * w, (centery - cpOffset) * h));
//     fig5.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery + radius) * h, (centerx + radius) * w, (centery + cpOffset) * h, (centerx + cpOffset) * w, (centery + radius) * h));
//     fig5.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius) * w, centery * h, (centerx - cpOffset) * w, (centery + radius) * h, (centerx - radius) * w, (centery + cpOffset) * h));
//     radius = 0.1;
//     cpOffset = KAPPA * 0.1;
//     centerx = 0.4;
//     centery = 0.9;
//     const fig6 = new go.PathFigure((centerx - radius) * w, centery * h, true);
//     geo.add(fig6);
//     fig6.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery - radius) * h, (centerx - radius) * w, (centery - cpOffset) * h, (centerx - cpOffset) * w, (centery - radius) * h));
//     fig6.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w, centery * h, (centerx + cpOffset) * w, (centery - radius) * h, (centerx + radius) * w, (centery - cpOffset) * h));
//     fig6.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery + radius) * h, (centerx + radius) * w, (centery + cpOffset) * h, (centerx + cpOffset) * w, (centery + radius) * h));
//     fig6.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius) * w, centery * h, (centerx - cpOffset) * w, (centery + radius) * h, (centerx - radius) * w, (centery + cpOffset) * h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('RailShipment', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0.1 * w, 0.4 * h, true);
//     geo.add(fig);
//     // Left cart
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.45 * w, 0.4 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.45 * w, 0.9 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.1 * w, 0.9 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.1 * w, 0.4 * h).close());
//     const fig2 = new go.PathFigure(0.45 * w, 0.7 * h, false);
//     geo.add(fig2);
//     // Line connecting carts
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.55 * w, 0.7 * h));
//     const fig3 = new go.PathFigure(0.55 * w, 0.4 * h, true);
//     geo.add(fig3);
//     // Right cart
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.9 * w, 0.4 * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.9 * w, 0.9 * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.55 * w, 0.9 * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.55 * w, 0.4 * h).close());
//     let radius = 0.05;
//     let cpOffset = KAPPA * 0.05;
//     let centerx = 0.175;
//     let centery = 0.95;
//     const fig4 = new go.PathFigure((centerx - radius) * w, centery * h, true);
//     geo.add(fig4);
//     // Wheels
//     fig4.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery - radius) * h, (centerx - radius) * w, (centery - cpOffset) * h, (centerx - cpOffset) * w, (centery - radius) * h));
//     fig4.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w, centery * h, (centerx + cpOffset) * w, (centery - radius) * h, (centerx + radius) * w, (centery - cpOffset) * h));
//     fig4.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery + radius) * h, (centerx + radius) * w, (centery + cpOffset) * h, (centerx + cpOffset) * w, (centery + radius) * h));
//     fig4.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius) * w, centery * h, (centerx - cpOffset) * w, (centery + radius) * h, (centerx - radius) * w, (centery + cpOffset) * h));
//     radius = 0.05;
//     cpOffset = KAPPA * 0.05;
//     centerx = 0.375;
//     centery = 0.95;
//     const fig5 = new go.PathFigure((centerx - radius) * w, centery * h, true);
//     geo.add(fig5);
//     fig5.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery - radius) * h, (centerx - radius) * w, (centery - cpOffset) * h, (centerx - cpOffset) * w, (centery - radius) * h));
//     fig5.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w, centery * h, (centerx + cpOffset) * w, (centery - radius) * h, (centerx + radius) * w, (centery - cpOffset) * h));
//     fig5.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery + radius) * h, (centerx + radius) * w, (centery + cpOffset) * h, (centerx + cpOffset) * w, (centery + radius) * h));
//     fig5.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius) * w, centery * h, (centerx - cpOffset) * w, (centery + radius) * h, (centerx - radius) * w, (centery + cpOffset) * h));
//     radius = 0.05;
//     cpOffset = KAPPA * 0.05;
//     centerx = 0.625;
//     centery = 0.95;
//     const fig6 = new go.PathFigure((centerx - radius) * w, centery * h, true);
//     geo.add(fig6);
//     fig6.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery - radius) * h, (centerx - radius) * w, (centery - cpOffset) * h, (centerx - cpOffset) * w, (centery - radius) * h));
//     fig6.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w, centery * h, (centerx + cpOffset) * w, (centery - radius) * h, (centerx + radius) * w, (centery - cpOffset) * h));
//     fig6.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery + radius) * h, (centerx + radius) * w, (centery + cpOffset) * h, (centerx + cpOffset) * w, (centery + radius) * h));
//     fig6.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius) * w, centery * h, (centerx - cpOffset) * w, (centery + radius) * h, (centerx - radius) * w, (centery + cpOffset) * h));
//     radius = 0.05;
//     cpOffset = KAPPA * 0.05;
//     centerx = 0.825;
//     centery = 0.95;
//     const fig7 = new go.PathFigure((centerx - radius) * w, centery * h, true);
//     geo.add(fig7);
//     fig7.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery - radius) * h, (centerx - radius) * w, (centery - cpOffset) * h, (centerx - cpOffset) * w, (centery - radius) * h));
//     fig7.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w, centery * h, (centerx + cpOffset) * w, (centery - radius) * h, (centerx + radius) * w, (centery - cpOffset) * h));
//     fig7.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery + radius) * h, (centerx + radius) * w, (centery + cpOffset) * h, (centerx + cpOffset) * w, (centery + radius) * h));
//     fig7.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius) * w, centery * h, (centerx - cpOffset) * w, (centery + radius) * h, (centerx - radius) * w, (centery + cpOffset) * h).close());
//     const fig8 = new go.PathFigure(0, h, false);
//     geo.add(fig8);
//     fig8.add(new go.PathSegment(go.SegmentType.Line, w, h).close());
//     return geo;
// });
// go.Shape.defineFigureGenerator('Warehouse', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0).close());
//     const fig2 = new go.PathFigure(0, 0.2 * h, false);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w, 0.2 * h).close());
//     const fig3 = new go.PathFigure(0.15 * w, h, true);
//     geo.add(fig3);
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.15 * w, 0.5 * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.4 * w, 0.5 * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.4 * w, h));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.15 * w, h).close());
//     const radius = 0.05;
//     const cpOffset = KAPPA * 0.05;
//     const centerx = 0.35;
//     const centery = 0.775;
//     const fig4 = new go.PathFigure((centerx - radius) * w, centery * h, true);
//     geo.add(fig4);
//     // Door handle
//     fig4.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery - radius) * h, (centerx - radius) * w, (centery - cpOffset) * h, (centerx - cpOffset) * w, (centery - radius) * h));
//     fig4.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w, centery * h, (centerx + cpOffset) * w, (centery - radius) * h, (centerx + radius) * w, (centery - cpOffset) * h));
//     fig4.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery + radius) * h, (centerx + radius) * w, (centery + cpOffset) * h, (centerx + cpOffset) * w, (centery + radius) * h));
//     fig4.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius) * w, centery * h, (centerx - cpOffset) * w, (centery + radius) * h, (centerx - radius) * w, (centery + cpOffset) * h).close());
//     return geo;
// });
// go.Shape.defineFigureGenerator('ControlCenter', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.8 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.1 * w, 0.8 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.1 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.9 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.9 * w, 0.8 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.8 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
//     fig.add(new go.PathSegment(go.SegmentType.Move, 0.1 * w, 0.8 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.9 * w, 0.8 * h).close());
//     return geo;
// });
// go.Shape.defineFigureGenerator('Bluetooth', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0.75 * h, false);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.75 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.25 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.75 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.25 * h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('Bookmark', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.6 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Move, 0.2 * w, 0.2 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, 0.2 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Move, 0.2 * w, 0.4 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, 0.4 * h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('Bookmark', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.6 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Move, 0.2 * w, 0.2 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, 0.2 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Move, 0.2 * w, 0.4 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, 0.4 * h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('Globe', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0.5 * w, 0, false);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Move, 0, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Move, 0.5 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, w, 0.5 * h, 0.75 * w, 0, w, 0.25 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, h, w, 0.75 * h, 0.75 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, 0.5 * h, 0.25 * w, h, 0, 0.75 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 0, 0, 0.25 * h, 0.25 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, h, 0.15 * w, 0.25 * h, 0.15 * w, 0.75 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 0, 0.85 * w, 0.75 * h, 0.85 * w, 0.25 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Move, 0.1675 * w, 0.15 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.8325 * w, 0.15 * h, 0.35 * w, 0.3 * h, 0.65 * w, 0.3 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Move, 0.1675 * w, 0.85 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.8325 * w, 0.85 * h, 0.35 * w, 0.7 * h, 0.65 * w, 0.7 * h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('Wave', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0.25 * h, false);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.3 * w, 0.25 * h, 0.1 * w, 0, 0.2 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.7 * w, 0.25 * h, 0.425 * w, 0.5 * h, 0.575 * w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, w, 0.25 * h, 0.8 * w, 0, 0.9 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.75 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Move, 0, 0.25 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.75 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.3 * w, 0.75 * h, 0.1 * w, 0.5 * h, 0.2 * w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.7 * w, 0.75 * h, 0.425 * w, h, 0.575 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, w, 0.75 * h, 0.8 * w, 0.5 * h, 0.9 * w, 0.5 * h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('Operator', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const radius = 0.3;
//     const cpOffset = KAPPA * 0.3;
//     const centerx = 0.5;
//     const centery = 0.7;
//     const fig = new go.PathFigure((centerx - radius) * w, centery * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery - radius) * h, (centerx - radius) * w, (centery - cpOffset) * h, (centerx - cpOffset) * w, (centery - radius) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w, centery * h, (centerx + cpOffset) * w, (centery - radius) * h, (centerx + radius) * w, (centery - cpOffset) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery + radius) * h, (centerx + radius) * w, (centery + cpOffset) * h, (centerx + cpOffset) * w, (centery + radius) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius) * w, centery * h, (centerx - cpOffset) * w, (centery + radius) * h, (centerx - radius) * w, (centery + cpOffset) * h));
//     const fig2 = new go.PathFigure(0, 0.7 * h, false);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, w, 0.7 * h, 0, 0, w, 0));
//     return geo;
// });
// go.Shape.defineFigureGenerator('TripleFanBlades', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0.5 * w, 0, true);
//     geo.add(fig);
//     // Top blade
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 0.65 * h, 0.65 * w, 0.3 * h, 0.65 * w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 0, 0.35 * w, 0.5 * h, 0.35 * w, 0.3 * h));
//     // Bottom left blade
//     fig.add(new go.PathSegment(go.SegmentType.Move, 0.5 * w, 0.65 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, h, 0.3 * w, 0.6 * h, 0.1 * w, 0.8 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 0.65 * h, 0.2 * w, h, 0.35 * w, 0.95 * h));
//     // Bottom right blade
//     fig.add(new go.PathSegment(go.SegmentType.Move, 0.5 * w, 0.65 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, w, h, 0.7 * w, 0.6 * h, 0.9 * w, 0.8 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 0.65 * h, 0.8 * w, h, 0.65 * w, 0.95 * h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('CentrifugalPump', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(w, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.4 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, 0.5 * h, 0, 0.075 * h, 0, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.4 * w, h, 0, h, 0.4 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.8 * w, 0.4 * h, 0.8 * w, h, 0.85 * w, 0.6 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.4 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0));
//     return geo;
// });
go.Shape.defineFigureGenerator('Battery', (shape, w, h) => {
    const geo = new go.Geometry();
    const fig = new go.PathFigure(0, h, true);
    geo.add(fig);
    fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.1 * h));
    fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.1 * h));
    fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
    fig.add(new go.PathSegment(go.SegmentType.Move, 0.4 * w, 0.1 * h));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.4 * w, 0));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.6 * w, 0));
    fig.add(new go.PathSegment(go.SegmentType.Line, 0.6 * w, 0.1 * h));
    const fig2 = new go.PathFigure(0, 0.6 * h, false);
    geo.add(fig2);
    fig2.add(new go.PathSegment(go.SegmentType.Move, 0, 0.4 * h));
    fig2.add(new go.PathSegment(go.SegmentType.Line, w, 0.4 * h));
    return geo;
});
// go.Shape.defineFigureGenerator('Delete', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const radius = 0.5;
//     const cpOffset = KAPPA * 0.5;
//     const centerx = 0.5;
//     const centery = 0.5;
//     const fig = new go.PathFigure((centerx - radius) * w, centery * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery - radius) * h, (centerx - radius) * w, (centery - cpOffset) * h, (centerx - cpOffset) * w, (centery - radius) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w, centery * h, (centerx + cpOffset) * w, (centery - radius) * h, (centerx + radius) * w, (centery - cpOffset) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery + radius) * h, (centerx + radius) * w, (centery + cpOffset) * h, (centerx + cpOffset) * w, (centery + radius) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius) * w, centery * h, (centerx - cpOffset) * w, (centery + radius) * h, (centerx - radius) * w, (centery + cpOffset) * h));
//     const fig2 = new go.PathFigure(0.15 * w, 0.5 * h, false);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.85 * w, 0.5 * h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('Flag', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0.1 * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
//     fig.add(new go.PathSegment(go.SegmentType.Move, 0, 0.1 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 0.1 * h, 0.15 * w, 0, 0.35 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, w, 0.1 * h, 0.65 * w, 0.2 * h, 0.85 * w, 0.2 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 0.5 * h, 0.85 * w, 0.6 * h, 0.65 * w, 0.6 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, 0.5 * h, 0.35 * w, 0.4 * h, 0.15 * w, 0.4 * h).close());
//     return geo;
// });
// go.Shape.defineFigureGenerator('Help', (shape, w, h) => {
//     const geo = new go.Geometry();
//     let radius = 0.5;
//     let cpOffset = KAPPA * 0.5;
//     let centerx = 0.5;
//     let centery = 0.5;
//     const fig = new go.PathFigure((centerx - radius) * w, centery * h, false);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery - radius) * h, (centerx - radius) * w, (centery - cpOffset) * h, (centerx - cpOffset) * w, (centery - radius) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w, centery * h, (centerx + cpOffset) * w, (centery - radius) * h, (centerx + radius) * w, (centery - cpOffset) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery + radius) * h, (centerx + radius) * w, (centery + cpOffset) * h, (centerx + cpOffset) * w, (centery + radius) * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius) * w, centery * h, (centerx - cpOffset) * w, (centery + radius) * h, (centerx - radius) * w, (centery + cpOffset) * h).close());
//     radius = 0.05;
//     cpOffset = KAPPA * 0.05;
//     centerx = 0.5;
//     centery = 0.8;
//     const fig2 = new go.PathFigure((centerx - radius) * w, centery * h, false);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery - radius) * h, (centerx - radius) * w, (centery - cpOffset) * h, (centerx - cpOffset) * w, (centery - radius) * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, (centerx + radius) * w, centery * h, (centerx + cpOffset) * w, (centery - radius) * h, (centerx + radius) * w, (centery - cpOffset) * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, centerx * w, (centery + radius) * h, (centerx + radius) * w, (centery + cpOffset) * h, (centerx + cpOffset) * w, (centery + radius) * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, (centerx - radius) * w, centery * h, (centerx - cpOffset) * w, (centery + radius) * h, (centerx - radius) * w, (centery + cpOffset) * h).close());
//     fig2.add(new go.PathSegment(go.SegmentType.Move, 0.5 * w, 0.7 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.5 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 0.2 * h, 0.75 * w, 0.475 * h, 0.75 * w, 0.225 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0.3 * w, 0.35 * h, 0.4 * w, 0.2 * h, 0.3 * w, 0.25 * h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('Location', (shape, w, h) => new go.Geometry().add(new go.PathFigure(0.5 * w, h, true)
//     .add(new go.PathSegment(go.SegmentType.Line, 0.75 * w, 0.5 * h))
//     .add(new go.PathSegment(go.SegmentType.Bezier, 0.5 * w, 0, 0.975 * w, 0.025 * h, 0.5 * w, 0))
//     .add(new go.PathSegment(go.SegmentType.Bezier, 0.25 * w, 0.5 * h, 0.5 * w, 0, 0.025 * w, 0.025 * h).close())
//     .add(new go.PathSegment(go.SegmentType.Move, 0.5 * w, 0.2 * h))
//     .add(new go.PathSegment(go.SegmentType.Arc, 270, 360, 0.5 * w, 0.3 * h, 0.1 * w, 0.1 * h).close())));
// go.Shape.defineFigureGenerator('Lock', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0.5 * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.5 * h));
//     const fig2 = new go.PathFigure(0.2 * w, 0.5 * h, false);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Move, 0.2 * w, 0.5 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, 0.3 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0.8 * w, 0.3 * h, 0.25 * w, 0, 0.75 * w, 0));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, 0.5 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, 0.3 * h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('Unlocked', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0.5 * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.5 * h));
//     const fig2 = new go.PathFigure(0.2 * w, 0.5 * h, false);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Move, 0.2 * w, 0.5 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, 0.3 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Bezier, 0.8 * w, 0.3 * h, 0.25 * w, 0, 0.75 * w, 0));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.8 * w, 0.35 * h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('Gear', (shape, w, h) => new go.Geometry().add(new go.PathFigure(0.9375 * w, 0.56246875 * h, true)
//     .add(new go.PathSegment(go.SegmentType.Line, 0.9375 * w, 0.4375 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.80621875 * w, 0.4375 * h))
//     .add(new go.PathSegment(go.SegmentType.Bezier, 0.763 * w, 0.3316875 * h, 0.79840625 * w, 0.39915625 * h, 0.7834375 * w, 0.3635 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.8566875 * w, 0.23796875 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.76825 * w, 0.14959375 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.67596875 * w, 0.24184375 * h))
//     .add(new go.PathSegment(go.SegmentType.Bezier, 0.5625 * w, 0.19378125 * h, 0.64228125 * w, 0.2188125 * h, 0.603875 * w, 0.2021875 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.5625 * w, 0.0625 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.4375 * w, 0.0625 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.4375 * w, 0.19378125 * h))
//     .add(new go.PathSegment(go.SegmentType.Bezier, 0.32775 * w, 0.239375 * h, 0.39759375 * w, 0.20190625 * h, 0.36053125 * w, 0.2176875 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.2379375 * w, 0.14959375 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.14953125 * w, 0.2379375 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.23934375 * w, 0.3278125 * h))
//     .add(new go.PathSegment(go.SegmentType.Bezier, 0.19378125 * w, 0.4375 * h, 0.21765625 * w, 0.36059375 * h, 0.201875 * w, 0.397625 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.0625 * w, 0.4375 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.0625 * w, 0.5625 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.1938125 * w, 0.5625 * h))
//     .add(new go.PathSegment(go.SegmentType.Bezier, 0.241875 * w, 0.67596875 * h, 0.20221875 * w, 0.603875 * h, 0.21884375 * w, 0.64228125 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.1495625 * w, 0.76825 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.238 * w, 0.8566875 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.3316875 * w, 0.76296875 * h))
//     .add(new go.PathSegment(go.SegmentType.Bezier, 0.43753125 * w, 0.80621875 * h, 0.36353125 * w, 0.78340625 * h, 0.3991875 * w, 0.79840625 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.43753125 * w, 0.9375 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.5625 * w, 0.9375 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.5625 * w, 0.80621875 * h))
//     .add(new go.PathSegment(go.SegmentType.Bezier, 0.67225 * w, 0.760625 * h, 0.602375 * w, 0.79809375 * h, 0.63946875 * w, 0.78234375 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.76828125 * w, 0.8566875 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.85671875 * w, 0.76825 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.76065625 * w, 0.67221875 * h))
//     .add(new go.PathSegment(go.SegmentType.Bezier, 0.80621875 * w, 0.56246875 * h, 0.78234375 * w, 0.63940625 * h, 0.798125 * w, 0.602375 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.9375 * w, 0.56246875 * h).close())
//     .add(new go.PathSegment(go.SegmentType.Move, 0.5 * w, 0.6 * h))
//     .add(new go.PathSegment(go.SegmentType.Arc, 90, 360, 0.5 * w, 0.5 * h, 0.1 * w, 0.1 * h).close())));
// go.Shape.defineFigureGenerator('Hand', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0.5 * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.1 * w, 0.3 * h, 0, 0.375 * h, 0.05 * w, 0.325 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.45 * w, 0.075 * h, 0.3 * w, 0.225 * h, 0.4 * w, 0.175 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.525 * w, 0.075 * h, 0.46 * w, 0.05 * h, 0.525 * w, 0.05 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.3 * w, 0.4 * h, 0.525 * w, 0.275 * h, 0.475 * w, 0.325 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.9 * w, 0.4 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.9 * w, 0.55 * h, w, 0.4 * h, w, 0.55 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.425 * w, 0.55 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.6 * w, 0.55 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.6 * w, 0.7 * h, 0.675 * w, 0.55 * h, 0.675 * w, 0.7 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.4 * w, 0.7 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.575 * w, 0.7 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.575 * w, 0.85 * h, 0.65 * w, 0.7 * h, 0.65 * w, 0.85 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.4 * w, 0.85 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.525 * w, 0.85 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.535 * w, h, 0.61 * w, 0.85 * h, 0.61 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, 0.9 * h, 0.435 * w, h, 0, h).close());
//     return geo;
// });
// go.Shape.defineFigureGenerator('Map', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0.2 * h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.25 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.2 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.75 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.2 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.75 * w, 0.8 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.25 * w, 0.8 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h).close());
//     fig.add(new go.PathSegment(go.SegmentType.Move, 0.25 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.25 * w, 0.8 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Move, 0.5 * w, 0.2 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Move, 0.75 * w, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.75 * w, 0.8 * h));
//     return geo;
// });
// go.Shape.defineFigureGenerator('Eject', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, h, true);
//     geo.add(fig);
//     // bottam rectangle section
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h * 0.7));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h * 0.7).close());
//     const fig2 = new go.PathFigure(0, h * 0.6, true);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w, 0.6 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0).close());
//     return geo;
// });
// go.Shape.defineFigureGenerator('Pencil', (shape, w, h) => new go.Geometry().add(new go.PathFigure(0, 0, true)
//     .add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, 0.1 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, w, 0.9 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.9 * w, h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.1 * w, 0.2 * h).close())));
// go.Shape.defineFigureGenerator('Building', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(w * 1, h * 1, false);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h * 1)); // bottom part
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h * 0.85));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.046 * w, h * 0.85));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.046 * w, h * 0.45));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h * 0.45));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h * 0.3));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.046 * w, h * 0.3));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, h * 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, (1 - 0.046) * w, h * 0.3));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h * 0.3));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h * 0.45));
//     fig.add(new go.PathSegment(go.SegmentType.Line, (1 - 0.046) * w, h * 0.45));
//     fig.add(new go.PathSegment(go.SegmentType.Line, (1 - 0.046) * w, h * 0.85));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h * 0.85).close());
//     const fig2 = new go.PathFigure(0.126 * w, 0.85 * h, false); // is filled in our not
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.126 * w, 0.45 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.322 * w, 0.45 * h));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, 0.322 * w, 0.85 * h).close());
//     const fig3 = new go.PathFigure(0.402 * w, 0.85 * h, false); // is filled in our not
//     geo.add(fig3);
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.402 * w, 0.45 * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.598 * w, 0.45 * h));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, 0.598 * w, 0.85 * h).close());
//     const fig4 = new go.PathFigure(0.678 * w, 0.85 * h, false); // is filled in our not
//     geo.add(fig4);
//     fig4.add(new go.PathSegment(go.SegmentType.Line, 0.678 * w, 0.45 * h));
//     fig4.add(new go.PathSegment(go.SegmentType.Line, 0.874 * w, 0.45 * h));
//     fig4.add(new go.PathSegment(go.SegmentType.Line, 0.874 * w, 0.85 * h).close());
//     // the top inner triangle
//     const fig5 = new go.PathFigure(0.5 * w, 0.1 * h, false); // is filled in our not
//     geo.add(fig5);
//     fig5.add(new go.PathSegment(go.SegmentType.Line, (0.046 + 0.15) * w, 0.3 * h));
//     fig5.add(new go.PathSegment(go.SegmentType.Line, (1 - (0.046 + 0.15)) * w, 0.3 * h).close());
//     return geo;
// });
// go.Shape.defineFigureGenerator('Staircase', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, h * 1, true);
//     geo.add(fig);
//     // Bottom part
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.2, h * 1)); // bottom left part
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.2, h * 0.8));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.4, h * 0.8));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.4, h * 0.6));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.6, h * 0.6));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.6, h * 0.4));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.8, h * 0.4));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.8, h * 0.2));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 1, h * 0.2));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 1, h * 0.15));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.75, h * 0.15));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.75, h * 0.35));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.55, h * 0.35));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.55, h * 0.55));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.35, h * 0.55));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.35, h * 0.75));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.15, h * 0.75));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.15, h * 0.95));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h * 0.95).close());
//     return geo;
// });
// go.Shape.defineFigureGenerator('5Bars', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, h * 1, true); // bottom left
//     geo.add(fig);
//     // Width of each bar is .184
//     // space in between each bar is .2
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.184, h * 1)); // bottom left part
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.184, h * (1 - 0.184)).close());
//     const fig3 = new go.PathFigure(w * 0.204, h, true); // is filled in our not
//     geo.add(fig3);
//     fig3.add(new go.PathSegment(go.SegmentType.Line, w * 0.204, h * (1 - 0.184)));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, w * 0.388, h * (1 - 0.184 * 2)));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, w * 0.388, h * 1).close());
//     const fig4 = new go.PathFigure(w * 0.408, h, true); // is filled in our not
//     geo.add(fig4);
//     fig4.add(new go.PathSegment(go.SegmentType.Line, w * 0.408, h * (1 - 0.184 * 2)));
//     fig4.add(new go.PathSegment(go.SegmentType.Line, w * 0.592, h * (1 - 0.184 * 3)));
//     fig4.add(new go.PathSegment(go.SegmentType.Line, w * 0.592, h * 1).close());
//     const fig5 = new go.PathFigure(w * 0.612, h, true); // is filled in our not
//     geo.add(fig5);
//     fig5.add(new go.PathSegment(go.SegmentType.Line, w * 0.612, h * (1 - 0.184 * 3)));
//     fig5.add(new go.PathSegment(go.SegmentType.Line, w * 0.796, h * (1 - 0.184 * 4)));
//     fig5.add(new go.PathSegment(go.SegmentType.Line, w * 0.796, h * 1).close());
//     const fig6 = new go.PathFigure(w * 0.816, h, true); // is filled in our not
//     geo.add(fig6);
//     fig6.add(new go.PathSegment(go.SegmentType.Line, w * 0.816, h * (1 - 0.184 * 4)));
//     fig6.add(new go.PathSegment(go.SegmentType.Line, w * 1, h * (1 - 0.184 * 5)));
//     fig6.add(new go.PathSegment(go.SegmentType.Line, w * 1, h * 1).close());
//     return geo;
// });
// // desktop
// go.Shape.defineFigureGenerator('PC', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0, true); // top right
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h * 1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.3, h * 1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.3, 0).close());
//     // Drive looking rectangle 1
//     const fig2 = new go.PathFigure(w * 0.055, 0.07 * h, true); // is filled in our not
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.245, h * 0.07));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.245, h * 0.1));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.055, h * 0.1).close());
//     // Drive looking rectangle 2
//     const fig3 = new go.PathFigure(w * 0.055, 0.13 * h, true); // is filled in our not
//     geo.add(fig3);
//     fig3.add(new go.PathSegment(go.SegmentType.Line, w * 0.245, h * 0.13));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, w * 0.245, h * 0.16));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, w * 0.055, h * 0.16).close());
//     // Drive/cd rom looking rectangle 3
//     const fig4 = new go.PathFigure(w * 0.055, 0.18 * h, true); // is filled in our not
//     geo.add(fig4);
//     fig4.add(new go.PathSegment(go.SegmentType.Line, w * 0.245, h * 0.18));
//     fig4.add(new go.PathSegment(go.SegmentType.Line, w * 0.245, h * 0.21));
//     fig4.add(new go.PathSegment(go.SegmentType.Line, w * 0.055, h * 0.21).close());
//     const fig5 = new go.PathFigure(w * 1, 0, true); // is filled in our not
//     geo.add(fig5);
//     fig5.add(new go.PathSegment(go.SegmentType.Line, w * 0.4, 0));
//     fig5.add(new go.PathSegment(go.SegmentType.Line, w * 0.4, h * 0.65));
//     fig5.add(new go.PathSegment(go.SegmentType.Line, w * 1, h * 0.65).close());
//     return geo;
// });
// go.Shape.defineFigureGenerator('Plane', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0.55 * w, h, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.6 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.4 * w, 0.7 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.1 * w, 0.475 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.35 * w, 0.525 * h, 0, 0.4 * h, 0.225 * w, 0.45 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.4 * w, 0.475 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.15 * w, 0.35 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, 0.325 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.6 * w, 0.325 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.85 * w, 0.1 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0.9 * w, 0.2 * h, 0.975 * w, 0, w, 0.08 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, 0.45 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.6 * w, 0.95 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0.55 * w, h).close());
//     return geo;
// });
// go.Shape.defineFigureGenerator('Key', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(w * 1, h * 0.5, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.9, 0.4 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.5, 0.4 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.5, 0.35 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.45, 0.35 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.3, 0.2 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.15, 0.2 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.35 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.65 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.15, 0.8 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.3, 0.8 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.45, 0.65 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.5, 0.65 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.5, 0.6 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.6, 0.6 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.65, 0.55 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.7, 0.6 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.75, 0.55 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.8, 0.6 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.85, 0.575 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.9, 0.6 * h).close());
//     fig.add(new go.PathSegment(go.SegmentType.Move, 0.17 * w, 0.425 * h));
//     fig.add(new go.PathSegment(go.SegmentType.Arc, 270, 360, 0.17 * w, 0.5 * h, 0.075 * w, 0.075 * h).close());
//     return geo;
// });
// // movie like logo
// go.Shape.defineFigureGenerator('FilmTape', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(0, 0, false);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Arc, 270, 180, w * 0, w * 0.3, w * 0.055)); // left semi-circle
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, h * 1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.08, h * 1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.08, h * 0.95));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 1), h * 0.95));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 1), h * 1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 2), h * 1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 2), h * 0.95));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 3), h * 0.95));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 3), h * 1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 4), h * 1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 4), h * 0.95));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 5), h * 0.95));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 5), h * 1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 6), h * 1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 6), h * 0.95));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 7), h * 0.95));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 7), h * 1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 8), h * 1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 8), h * 0.95));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 9), h * 0.95));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 9), h * 1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 10), h * 1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 10), h * 0.95));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 11), h * 0.95));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 11), h * 1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 12), h * 1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 12), h * 0.95));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 13), h * 0.95));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 13), h * 1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 14), h * 1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 14), h * 0.95));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 15), h * 0.95));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (0.08 + 0.056 * 15), h * 1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 1, h * 1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 1, h * 1));
//     const fig2 = new go.PathFigure(0, 0, false); // is filled in our not
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 1, h * 0));
//     fig2.add(new go.PathSegment(go.SegmentType.Arc, 270, -180, w * 1, w * 0.3, w * 0.055)); // right semi circle
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 1, h * 1));
//     // Each of the little square boxes on the tape
//     const fig3 = new go.PathFigure(w * 0.11, h * 0.1, false); // is filled in our not
//     geo.add(fig3);
//     fig3.add(new go.PathSegment(go.SegmentType.Line, w * (0.11 + 0.24133333 * 1 + 0.028 * 0), h * 0.1));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, w * (0.11 + 0.24133333 * 1 + 0.028 * 0), h * 0.8));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, w * 0.11, h * 0.8).close());
//     const fig4 = new go.PathFigure(w * (0.11 + 0.24133333 * 1 + 0.028 * 1), h * 0.1, false); // is filled in our not
//     geo.add(fig4);
//     fig4.add(new go.PathSegment(go.SegmentType.Line, w * (0.11 + 0.24133333 * 2 + 0.028 * 1), h * 0.1));
//     fig4.add(new go.PathSegment(go.SegmentType.Line, w * (0.11 + 0.24133333 * 2 + 0.028 * 1), h * 0.8));
//     fig4.add(new go.PathSegment(go.SegmentType.Line, w * (0.11 + 0.24133333 * 1 + 0.028 * 1), h * 0.8).close());
//     const fig5 = new go.PathFigure(w * (0.11 + 0.24133333 * 2 + 0.028 * 2), h * 0.1, false); // is filled in our not
//     geo.add(fig5);
//     fig5.add(new go.PathSegment(go.SegmentType.Line, w * (0.11 + 0.24133333 * 3 + 0.028 * 2), h * 0.1));
//     fig5.add(new go.PathSegment(go.SegmentType.Line, w * (0.11 + 0.24133333 * 3 + 0.028 * 2), h * 0.8));
//     fig5.add(new go.PathSegment(go.SegmentType.Line, w * (0.11 + 0.24133333 * 2 + 0.028 * 2), h * 0.8).close());
//     return geo;
// });
// go.Shape.defineFigureGenerator('FloppyDisk', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const roundValue = 8;
//     const cpOffset = roundValue * KAPPA;
//     const fig = new go.PathFigure(roundValue, 0, false);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.86, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 1, h * 0.14));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h - roundValue));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, w - roundValue, h, w, h - cpOffset, w - cpOffset, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, roundValue, h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, h - roundValue, cpOffset, h, 0, h - cpOffset));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, roundValue));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, roundValue, 0, 0, cpOffset, cpOffset, 0).close());
//     // interior slightly  rectangle
//     const fig2 = new go.PathFigure(w * 0.83, 0, false);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.83, h * 0.3));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.17, h * 0.3));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.17, h * 0).close());
//     const fig3 = new go.PathFigure(w * 0.83, h * 1, false);
//     geo.add(fig3);
//     fig3.add(new go.PathSegment(go.SegmentType.Line, w * 0.83, h * 0.5));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, w * 0.17, h * 0.5));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, w * 0.17, h * 1).close());
//     const fig4 = new go.PathFigure(w * 0.78, h * 0.05, false);
//     geo.add(fig4);
//     fig4.add(new go.PathSegment(go.SegmentType.Line, w * 0.66, h * 0.05));
//     fig4.add(new go.PathSegment(go.SegmentType.Line, w * 0.66, h * 0.25));
//     fig4.add(new go.PathSegment(go.SegmentType.Line, w * 0.78, h * 0.25).close());
//     return geo;
// });
// go.Shape.defineFigureGenerator('SpeechBubble', (shape, w, h) => {
//     let param1 = shape ? shape.parameter1 : NaN;
//     if (isNaN(param1) || param1 < 0)
//         param1 = 15; // default corner
//     param1 = Math.min(param1, w / 3);
//     param1 = Math.min(param1, h / 3);
//     const cpOffset = param1 * KAPPA;
//     const bubbleH = h * 0.8; // leave some room at bottom for pointer
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(param1, 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w - param1, 0));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, w, param1, w - cpOffset, 0, w, cpOffset));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, bubbleH - param1));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, w - param1, bubbleH, w, bubbleH - cpOffset, w - cpOffset, bubbleH));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.7, bubbleH));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.7, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.55, bubbleH));
//     fig.add(new go.PathSegment(go.SegmentType.Line, param1, bubbleH));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, bubbleH - param1, cpOffset, bubbleH, 0, bubbleH - cpOffset));
//     fig.add(new go.PathSegment(go.SegmentType.Line, 0, param1));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, param1, 0, 0, cpOffset, cpOffset, 0).close());
//     if (cpOffset > 1) {
//         geo.spot1 = new go.Spot(0, 0, cpOffset, cpOffset);
//         geo.spot2 = new go.Spot(1, 0.8, -cpOffset, -cpOffset);
//     }
//     else {
//         geo.spot1 = go.Spot.TopLeft;
//         geo.spot2 = new go.Spot(1, 0.8);
//     }
//     return geo;
// });
// go.Shape.defineFigureGenerator('Repeat', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(w * 0, h * 0.45, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.25, h * 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.5, h * 0.45));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.3, h * 0.45));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.3, h * 0.9));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.6, h * 0.9));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.65, h * 1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.2, h * 1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.2, h * 0.45).close());
//     const fig2 = new go.PathFigure(w * 1, h * 0.55, true); // is filled in our not
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.75, h * 1));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.5, h * 0.55));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.7, h * 0.55));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.7, h * 0.1));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.4, h * 0.1));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.35, h * 0));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.8, h * 0));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.8, h * 0.55).close());
//     return geo;
// });
// go.Shape.defineFigureGenerator('Windows', (shape, w, h) => new go.Geometry().add(new go.PathFigure(0, 0, true)
//     .add(new go.PathSegment(go.SegmentType.Line, w, 0))
//     .add(new go.PathSegment(go.SegmentType.Line, w, h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0, h).close())
//     .add(new go.PathSegment(go.SegmentType.Move, 0.4 * w, 0.4 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.4 * w, 0.8 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.9 * w, 0.8 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.9 * w, 0.4 * h).close())
//     .add(new go.PathSegment(go.SegmentType.Move, 0.2 * w, 0.1 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.2 * w, 0.6 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, 0.6 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.7 * w, 0.1 * h).close())
//     .add(new go.PathSegment(go.SegmentType.Move, 0.1 * w, 0.6 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.1 * w, 0.9 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.9 * h))
//     .add(new go.PathSegment(go.SegmentType.Line, 0.5 * w, 0.6 * h).close())));
// go.Shape.defineFigureGenerator('Terminal', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(w * 0, h * 0.1, false);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 1, h * 0.1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 1, h * 0.9));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0, h * 0.9).close());
//     const fig2 = new go.PathFigure(w * 0.1, h * 0.2, true); // is filled in our not
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.1, h * 0.25));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.22, h * 0.285)); // midpoint
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.1, h * 0.32));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.1, h * 0.37));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.275, h * 0.32));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.275, h * 0.25).close());
//     const fig3 = new go.PathFigure(w * 0.28, h * 0.37, true); // is filled in our not
//     geo.add(fig3);
//     fig3.add(new go.PathSegment(go.SegmentType.Line, w * 0.45, h * 0.37));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, w * 0.45, h * 0.41));
//     fig3.add(new go.PathSegment(go.SegmentType.Line, w * 0.28, h * 0.41).close());
//     return geo;
// });
// go.Shape.defineFigureGenerator('Beaker', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const param1 = 15;
//     const cpOffset = param1 * KAPPA;
//     const fig = new go.PathFigure(w * 0.62, h * 0.475, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w, h - param1));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, w - param1, h, w, h - cpOffset, w - cpOffset, h));
//     fig.add(new go.PathSegment(go.SegmentType.Line, param1, h));
//     fig.add(new go.PathSegment(go.SegmentType.Bezier, 0, h - param1, cpOffset, h, 0, h - cpOffset));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.38, h * 0.475));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.38, h * 0.03));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.36, h * 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.64, h * 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.62, h * 0.03).close());
//     if (cpOffset > 1) {
//         geo.spot1 = new go.Spot(0, 0, cpOffset, cpOffset);
//         geo.spot2 = new go.Spot(1, 1, -cpOffset, -cpOffset);
//     }
//     else {
//         geo.spot1 = go.Spot.TopLeft;
//         geo.spot2 = go.Spot.BottomRight;
//     }
//     return geo;
// });
// go.Shape.defineFigureGenerator('Download', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(w * 0, h * 1, true);
//     geo.add(fig);
//     const third = 0.1 / 0.3; // just to keep values consistent
//     // outer frame
//     // starts bottom left
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 1, h * 1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 1, h * (1 - third)));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.8, h * 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.66, h * 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.66, h * 0.055));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.755, h * 0.055));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.93, h * (1 - third)));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.64, h * (1 - third)));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.61, h * 0.75));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.5, h * 0.75));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.39, h * 0.75));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.36, h * (1 - third)));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.07, h * (1 - third)));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (1 - 0.755), h * 0.055));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (1 - 0.66), h * 0.055));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (1 - 0.66), h * 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (1 - 0.8), h * 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0, h * (1 - third)).close());
//     // arrow pointing down
//     const fig2 = new go.PathFigure(w * 0.4, h * 0, true);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.4, h * 0.44));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.26, h * 0.44));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.5, h * 0.66));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * (1 - 0.26), h * 0.44));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.6, h * 0.44));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.6, h * 0).close());
//     return geo;
// });
// go.Shape.defineFigureGenerator('Bin', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(w * 0, h * 1, true);
//     geo.add(fig);
//     const third = 0.1 / 0.3; // just to keep values consistent
//     // outer frame
//     // starts bottom left
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 1, h * 1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 1, h * (1 - third)));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.8, h * 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.66, h * 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.66, h * 0.055));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.755, h * 0.055));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.93, h * (1 - third)));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.64, h * (1 - third)));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.61, h * 0.75));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.5, h * 0.75));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.39, h * 0.75));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.36, h * (1 - third)));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.07, h * (1 - third)));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (1 - 0.755), h * 0.055));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (1 - 0.66), h * 0.055));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (1 - 0.66), h * 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (1 - 0.8), h * 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0, h * (1 - third)).close());
//     return geo;
// });
// go.Shape.defineFigureGenerator('Upload', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(w * 0, h * 1, true);
//     geo.add(fig);
//     const third = 0.1 / 0.3; // just to keep values consistent
//     // outer frame
//     // starts bottom left
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 1, h * 1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 1, h * (1 - third)));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.8, h * 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.66, h * 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.66, h * 0.055));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.755, h * 0.055));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.93, h * (1 - third)));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.64, h * (1 - third)));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.61, h * 0.75));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.5, h * 0.75));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.39, h * 0.75));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.36, h * (1 - third)));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.07, h * (1 - third)));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (1 - 0.755), h * 0.055));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (1 - 0.66), h * 0.055));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (1 - 0.66), h * 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * (1 - 0.8), h * 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0, h * (1 - third)).close());
//     const fig2 = new go.PathFigure(w * 0.5, h * 0, true);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.26, h * 0.25));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.4, h * 0.25));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.4, h * 0.63));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.6, h * 0.63));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.6, h * 0.25));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.74, h * 0.25).close());
//     return geo;
// });
// go.Shape.defineFigureGenerator('EmptyDrink', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(w * 0.15, h * 0, false);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.85, h * 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.7, h * 1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.3, h * 1).close());
//     return geo;
// });
// go.Shape.defineFigureGenerator('Drink', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(w * 0.15, h * 0, false);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.85, h * 0));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.7, h * 1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.3, h * 1).close());
//     const fig2 = new go.PathFigure(w * 0.235, h * 0.28, true);
//     geo.add(fig2);
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.765, h * 0.28));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.655, h * 0.97));
//     fig2.add(new go.PathSegment(go.SegmentType.Line, w * 0.345, h * 0.97).close());
//     return geo;
// });
// go.Shape.defineFigureGenerator('4Arrows', (shape, w, h) => {
//     const geo = new go.Geometry();
//     const fig = new go.PathFigure(w * 0.5, h * 0, true);
//     geo.add(fig);
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.65, h * 0.25));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.55, h * 0.25));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.55, h * 0.45));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.75, h * 0.45));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.75, h * 0.35));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 1, h * 0.5));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.75, h * 0.65));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.75, h * 0.55));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.55, h * 0.55));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.55, h * 0.75));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.65, h * 0.75));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.5, h * 1));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.35, h * 0.75));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.45, h * 0.75));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.45, h * 0.55));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.25, h * 0.55));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.25, h * 0.65));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0, h * 0.5));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.25, h * 0.35));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.25, h * 0.45));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.45, h * 0.45));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.45, h * 0.25));
//     fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.35, h * 0.25).close());
//     return geo;
// });
// go.Shape.defineFigureGenerator('Connector', 'Ellipse');
// go.Shape.defineFigureGenerator('Alternative', 'TriangleUp');
// go.Shape.defineFigureGenerator('Merge', 'TriangleUp');
// go.Shape.defineFigureGenerator('Decision', 'Diamond');
// go.Shape.defineFigureGenerator('DataTransmissions', 'Hexagon');
// go.Shape.defineFigureGenerator('Gate', 'Crescent');
// go.Shape.defineFigureGenerator('Delay', 'HalfEllipse');
// go.Shape.defineFigureGenerator('Input', 'Parallelogram1');
// go.Shape.defineFigureGenerator('ManualLoop', 'ManualOperation');
// go.Shape.defineFigureGenerator('ISOProcess', 'Chevron');
// go.Shape.defineFigureGenerator('MessageToUser', 'SquareArrow');
// go.Shape.defineFigureGenerator('MagneticData', 'Cylinder1');
// go.Shape.defineFigureGenerator('DirectData', 'Cylinder4');
// go.Shape.defineFigureGenerator('StoredData', 'DataStorage');
// go.Shape.defineFigureGenerator('SequentialData', 'MagneticTape');
// go.Shape.defineFigureGenerator('Subroutine', 'Procedure');





