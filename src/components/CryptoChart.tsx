const CryptoChart = () => {
  return (
    <div className="glass-card p-6 rounded-lg mb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Bitcoin Price</h2>
      </div>
      <div className="h-[400px] w-full">
        <div className="tradingview-widget-container h-full">
          <div id="tradingview_chart" className="h-full" />
        </div>
      </div>
    </div>
  );
};

// Initialize TradingView widget when component mounts
if (typeof window !== 'undefined') {
  const script = document.createElement('script');
  script.src = 'https://s3.tradingview.com/tv.js';
  script.async = true;
  script.onload = () => {
    if (typeof window.TradingView !== 'undefined') {
      new window.TradingView.widget({
        autosize: true,
        symbol: "BINANCE:BTCUSDT",
        interval: "D",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#141413",
        enable_publishing: false,
        hide_top_toolbar: false,
        save_image: false,
        container_id: "tradingview_chart",
      });
    }
  };
  document.head.appendChild(script);
}

export default CryptoChart;