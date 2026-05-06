/**
 * Forma 1:1 con `TracePointRequest` del OpenAPI:
 * el backend espera exactamente estos cuatro campos.
 */
export interface SignaturePoint {
  /** X relativa al canvas, en pixeles CSS. */
  x: number;
  /** Y relativa al canvas, en pixeles CSS. */
  y: number;
  /** Milisegundos desde el inicio del primer trazo. */
  t: number;
  /** Presion 0-1 (0.5 si el dispositivo no la reporta). */
  p: number;
}

export interface SignatureMetadata {
  /** Duracion total entre el primer y el ultimo punto, en ms. */
  duracion_ms: number;
  /** Presion maxima registrada en cualquier punto (0-1). */
  presion_max: number;
  /** Presion media de todos los puntos (0-1). */
  presion_media: number;
  /** Velocidad media en pixeles por segundo, calculada como (sum dist) / (duration s). */
  velocidad_media_px_s: number;
  /** Numero total de puntos capturados. */
  num_puntos: number;
}

export function computeSignatureMetadata(points: SignaturePoint[]): SignatureMetadata {
  if (points.length < 2) {
    const onePressure = points.length === 1 ? points[0].p : 0;
    return {
      duracion_ms: 0,
      presion_max: onePressure,
      presion_media: onePressure,
      velocidad_media_px_s: 0,
      num_puntos: points.length,
    };
  }

  let totalDistance = 0;
  let pressureSum = 0;
  let pressureMax = 0;
  for (let i = 0; i < points.length; i += 1) {
    pressureSum += points[i].p;
    if (points[i].p > pressureMax) pressureMax = points[i].p;
    if (i > 0) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      totalDistance += Math.sqrt(dx * dx + dy * dy);
    }
  }

  const duracion_ms = points[points.length - 1].t - points[0].t;
  const seconds = duracion_ms > 0 ? duracion_ms / 1000 : 0;

  return {
    duracion_ms,
    presion_max: pressureMax,
    presion_media: pressureSum / points.length,
    velocidad_media_px_s: seconds > 0 ? totalDistance / seconds : 0,
    num_puntos: points.length,
  };
}
