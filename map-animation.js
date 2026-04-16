// map-animation.js
// 处理基础蓝色中国地图渲染及悬停效果

class MapAnimator {
  constructor(chartInstance, config) {
    this.chart = chartInstance;
    this.config = config;
    this.initChart();
    this.bindEvents();
  }

  initChart() {
    this.chart.setOption({
      backgroundColor: this.config.theme.backgroundColor,
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(11, 38, 70, 0.9)',
        borderColor: '#22d3ee',
        textStyle: { color: '#fff' },
        formatter: '{b}' // 仅显示省份名称
      },
      geo: {
        map: 'china',
        roam: true,
        zoom: 1.25,
        center: [102.114129, 36.550339], // 默认地图中心点
        itemStyle: {
          areaColor: this.config.theme.mapAreaColor,
          borderColor: this.config.theme.mapBorderColor,
          borderWidth: 1.2,
          shadowColor: 'rgba(34, 211, 238, 0.2)',
          shadowBlur: 10
        },
        label: {
          show: true,
          color: 'rgba(255, 255, 255, 0.5)', // 默认省份文字较暗
          fontSize: 10
        },
        emphasis: {
          itemStyle: { 
            areaColor: this.config.theme.mapEmphasisColor,
            shadowColor: '#22d3ee',
            shadowBlur: 20
          },
          label: { 
            show: true,
            color: this.config.theme.labelColor,
            fontSize: 12,
            fontWeight: 'bold'
          }
        }
      },
      series: [] // 暂无路线和散点
    });
  }

  bindEvents() {
    // 监听省份悬停
    this.chart.on('mouseover', (params) => {
      if (params.componentType === 'geo') {
        const event = new CustomEvent('nodeHovered', { detail: { name: params.name } });
        window.dispatchEvent(event);
      }
    });

    this.chart.on('mouseout', (params) => {
      if (params.componentType === 'geo') {
        const event = new CustomEvent('nodeHovered', { detail: null });
        window.dispatchEvent(event);
      }
    });
  }
}

window.MapAnimator = MapAnimator;
