export function doughnut(
  name: string,
  totalLabel: string | null,
  data: { value: number; name: string }[],
) {
  return {
    tooltip: {
      trigger: 'item',
    },
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: 'center',
        style: {
          text: totalLabel ? `${sumValues(data)}\n${totalLabel}` : '',
          textAlign: 'center',
          fill: '#333',
          fontSize: 24,
          fontWeight: 'bold',
          lineHeight: 30,
        },
      },
    ],
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        labelLine: {
          show: false,
        },
        data: data,
      },
    ],
  };
}

function sumValues(items: { value: number; name: string }[]): number {
  return items.reduce((sum, item) => sum + item.value, 0);
}
