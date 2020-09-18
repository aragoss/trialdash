import React from 'react';
import { Polyline, CircleMarker } from "react-leaflet";
import { MarkedPoint } from './MarkedPoint';
import { polylineDistance, distToText } from './GeometryUtils';

export const MarkedShape = ({ markedPoints, setMarkedPoints, shape, shapeCreator, deviceNum }) => {
    const currPolyline = React.useRef(null);
    const auxPolyline = React.useRef(null);

    let candLocs = shapeCreator.toPositions(markedPoints, deviceNum).filter(x => x);
    // const candRefs = React.useRef(candLocs.map(() => React.createRef()));

    const setLatLngsWithDist = (leafletElement, points) => {
        leafletElement.setLatLngs(points);
        const dist = polylineDistance(leafletElement.getLatLngs());
        if (dist > 0) {
            leafletElement.bindTooltip(distToText(dist)).openTooltip();
        }
    };

    const renderShape = (points) => {
        points = points || markedPoints;
        if (!points.length) return;
        const shownPolylines = shapeCreator.toLine(points);
        setLatLngsWithDist(currPolyline.current.leafletElement, shownPolylines[0]);
        if (shape === 'Arc') {
            setLatLngsWithDist(auxPolyline.current.leafletElement, shownPolylines.length > 1 ? shownPolylines[1] : []);
        }
    };


    const replacePoint = (points, i, newPoint) => {
        const newPoints = points.slice();
        newPoints[i] = newPoint;
        return newPoints;
    }

    React.useEffect(() => {
        renderShape();
    });

    return (
        <>
            {
                markedPoints.map((p, i) => (
                    <MarkedPoint
                        location={p}
                        setLocation={(latlng) => {
                            setMarkedPoints(replacePoint(markedPoints, i, latlng));
                        }}
                        dragLocation={(latlng) => {
                            renderShape(replacePoint(markedPoints, i, latlng));
                            // candLocs = shapeCreator.toPositions(markedPoints, deviceNum).filter(x => x);
                            // candLocs.forEach((loc, index) => {
                            //     candRefs.current[index].current.leafletElement.center = loc;
                            // });
                        }}
                    ></MarkedPoint>
                ))
            }
            <Polyline positions={[]} ref={currPolyline} />
            {
                shape !== 'Arc' ? null :
                    <Polyline positions={[]} ref={auxPolyline} />
            }
            {
                candLocs.map((loc, index) => {
                    return <CircleMarker center={loc} key={index} // ref={candRefs.current[index]}
                        radius={7} color={'#297A31'} opacity={0.7} dashArray={'4 4'} weight={2}
                    />
                })
            }
        </>
    )
}