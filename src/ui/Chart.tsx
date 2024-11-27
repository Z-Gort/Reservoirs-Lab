import { useMemo } from 'react';
import { BaseChart } from './BaseChart';

export type ChartProps = {
  data: number[];
  maxDataPoints: number;
  selectedView: 'CPU' | 'RAM' | 'STORAGE';
};

export const COLOR_MAP = {
  CPU: {
    stroke: '#FF0000', // changed from '#5DD4EE' to '#FF0000' (red)
    fill: '#8B0A0A', // changed from '#0A4D5C' to '#8B0A0A' (dark red)
  },
  RAM: {
    stroke: '#E99311',
    fill: '#5F3C07',
  },
  STORAGE: {
    stroke: '#1ACF4D',
    fill: '#0B5B22',
  },
};

export function Chart(props: ChartProps) {
  const color = useMemo(
    () => COLOR_MAP[props.selectedView],
    [props.selectedView]
  );
  const preparedData = useMemo(() => {
    const points = props.data.map((point) => ({ value: point * 100 }));
    return [
      ...points,
      ...Array.from({ length: props.maxDataPoints - points.length }).map(
        () => ({ value: undefined })
      ),
    ];
  }, [props.data, props.maxDataPoints]);

  return (
    <BaseChart data={preparedData} fill={color.fill} stroke={color.stroke} />
  );
}