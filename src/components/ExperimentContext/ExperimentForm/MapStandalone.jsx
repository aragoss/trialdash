import React, { useState } from "react";
import {
  Grid,
} from '@material-ui/core';
import { MarkedPoint } from "../../EntityPlanner/MarkedPoint";
import { MapWithImage } from "./MapWithImage";
import { NumberTextField } from "./NumberTextField";
import { DashedPolyline } from "./DashedPolyline";
import { ChosenMarker } from "./ChosenMarker";

const pointLatLngToMeters = (p) => {
  const fix = (n) => Math.round(n * 1e9) / 1e9;
  return `(${fix(p.lng)}, ${fix(p.lat)}) in meters<br/>(${fix(p.x)}, ${fix(p.y)}) in pixels`;
}

export const MapStandalone = ({ row, setRow }) => {
  const mapRef = React.useRef(null);

  const imageSize = { x: row.width || 300, y: row.height || 400 };

  const [anchor, setAnchor] = useState({
    lat: row.lower,
    lng: row.left,
    x: 0,
    y: 0
  });

  const [distances, setDistances] = useState({
    x: imageSize.x,
    y: imageSize.y,
    lat: row.upper - row.lower,
    lng: row.right - row.left
  });

  React.useEffect(() => {
    mapRef.current.leafletElement.fitBounds([[row.lower, row.left], [row.upper, row.right]]);
  }, []);

  const dlat = Math.abs(distances.lat) * Math.sign(distances.y);
  const dlng = Math.abs(distances.lng) * Math.sign(distances.x);
  const horizontalPoint = { lat: anchor.lat, lng: anchor.lng + dlng, x: anchor.x + distances.x, y: anchor.y };
  const verticalPoint = { lat: anchor.lat + dlat, lng: anchor.lng, x: anchor.x, y: anchor.y + distances.y };

  React.useEffect(() => {
    if (Math.min(Math.abs(distances.x), Math.abs(distances.y), Math.abs(distances.lat), Math.abs(distances.lng)) < 1e-6) {
      return;
    }

    const right = Math.round((anchor.lng + dlng / distances.x * (imageSize.x - anchor.x)) * 1e9) / 1e9;
    const left = Math.round((horizontalPoint.lng - dlng / distances.x * horizontalPoint.x) * 1e9) / 1e9;
    const lower = Math.round((anchor.lat - dlat / distances.y * anchor.y) * 1e9) / 1e9;
    const upper = Math.round((verticalPoint.lat + dlat / distances.y * (imageSize.y - verticalPoint.y)) * 1e9) / 1e9;

    if (Math.max(Math.abs(right - row.right), Math.abs(left - row.left), Math.abs(lower - row.lower), Math.abs(upper - row.upper)) < 1e-6) {
      return;
    }

    // console.log('right', right, row.right);
    // console.log('left', left, row.left);
    // console.log('lower', lower, row.lower);
    // console.log('upper', upper, row.upper);

    setRow(Object.assign({}, row, { lower, right, upper, left }));
    setTimeout(() => {
      mapRef.current.leafletElement.fitBounds([[lower, left], [upper, right]]);
    }, 200);
  });

  return (
    <Grid container>
      <Grid item xs={3}>
        <Grid container direction="column"
          justify="flex-start"
          alignItems="center"
          spacing={2}
        >
          <Grid item>
            Image size: ({imageSize.x} x {imageSize.y}) <br />
          </Grid>
          <Grid item>
            <Grid container spacing={2}>
              <Grid item>
                <NumberTextField value={anchor.lng} onChange={(num) => setAnchor({ ...anchor, lng: num })} label="Anchor X meters" width='150px' />
              </Grid>
              <Grid item>
                <NumberTextField value={anchor.lat} onChange={(num) => setAnchor({ ...anchor, lat: num })} label="Anchor Y meters" width='150px' />
              </Grid>
            </Grid>
          </Grid>
          <Grid item>
            <Grid container spacing={2}>
              <Grid item>
                <NumberTextField value={anchor.x} onChange={(num) => setAnchor({ ...anchor, x: num })} label="Anchor X pixels" width='150px' />
              </Grid>
              <Grid item>
                <NumberTextField value={anchor.y} onChange={(num) => setAnchor({ ...anchor, y: num })} label="Anchor Y pixels" width='150px' />
              </Grid>
            </Grid>
          </Grid>
          <Grid item>
            <Grid container spacing={2}>
              <Grid item>
                <NumberTextField value={distances.lng} onChange={(num) => setDistances({ ...distances, lng: Math.abs(num) })} label="Horizontal Meters" width='150px' />
              </Grid>
              <Grid item>
                <NumberTextField value={distances.x} onChange={(num) => setDistances({ ...distances, x: num })} label="Horizontal Pixels" width='150px' />
              </Grid>
            </Grid>
          </Grid>
          <Grid item>
            <Grid container spacing={2}>
              <Grid item>
                <NumberTextField value={distances.lat} onChange={(num) => setDistances({ ...distances, lat: Math.abs(num) })} label="Vertical Meters" width='150px' />
              </Grid>
              <Grid item>
                <NumberTextField value={distances.y} onChange={(num) => setDistances({ ...distances, y: num })} label="Vertical Pixels" width='150px' />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={9}>
        <MapWithImage
          ref={mapRef}
          showMap={false}
          imageUrl={row.imageUrl}
          imageBounds={[[row.upper, row.left], [row.lower, row.right]]}
        >
          <MarkedPoint
            key='anchor'
            location={[anchor.lat, anchor.lng]}
            setLocation={p => {
              const x = (p[1] - row.left) / (row.right - row.left) * imageSize.x;
              const y = (p[0] - row.lower) / (row.upper - row.lower) * imageSize.y;
              setAnchor({ lat: p[0], lng: p[1], x, y });
            }}
            locationToShow={pointLatLngToMeters(anchor)}
          >
          </MarkedPoint>
          <ChosenMarker
            key='chosen'
            center={anchor}
          />
          <MarkedPoint
            key='horiz'
            location={[horizontalPoint.lat, horizontalPoint.lng]}
            setLocation={p => {
              const xmeters = p[1] - anchor.lng;
              const x = xmeters / (row.right - row.left) * imageSize.x;
              setDistances({ ...distances, x, lng: Math.abs(xmeters) })
            }}
            locationToShow={pointLatLngToMeters(horizontalPoint)}
          >
          </MarkedPoint>
          <MarkedPoint
            key='verti'
            location={[verticalPoint.lat, verticalPoint.lng]}
            setLocation={p => {
              const ymeters = p[0] - anchor.lat;
              const y = ymeters / (row.upper - row.lower) * imageSize.y;
              setDistances({ ...distances, y, lat: Math.abs(ymeters) })
            }}
            locationToShow={pointLatLngToMeters(verticalPoint)}
          >
          </MarkedPoint>
          <DashedPolyline
            positions={[verticalPoint, anchor, horizontalPoint]}
          >
          </DashedPolyline>
        </MapWithImage>
      </Grid>
    </Grid >
  )
}