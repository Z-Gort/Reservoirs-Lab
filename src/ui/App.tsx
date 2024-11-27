import { useEffect, useMemo, useState } from 'react';
import reactLogo from './assets/react.svg';
import './App.css';
import { useStatistics } from './useStatistics';
import { Chart } from './Chart';
import Button from '@mui/material/Button';
import { styled } from "@mui/material/styles";

function App() {
  const staticData = useStaticData();
  const statistics = useStatistics(10);
  const [activeView, setActiveView] = useState<View>('CPU');
  const cpuUsages = useMemo(
    () => statistics.map((stat) => stat.cpuUsage),
    [statistics]
  );
  const ramUsages = useMemo(
    () => statistics.map((stat) => stat.ramUsage),
    [statistics]
  );
  const storageUsages = useMemo(
    () => statistics.map((stat) => stat.storageUsage),
    [statistics]
  );
  const activeUsages = useMemo(() => {
    switch (activeView) {
      case 'CPU':
        return cpuUsages;
      case 'RAM':
        return ramUsages;
      case 'STORAGE':
        return storageUsages;
    }
  }, [activeView, cpuUsages, ramUsages, storageUsages]);

  useEffect(() => {
    return window.electron.subscribeChangeView((view) => setActiveView(view));
  }, []);

  const openPopup = () => {
    window.electron.send("openPopup", undefined); // Send event to main process
  };

  return (
    <div className="App">
      <Header />
      <div className="main">
        <Button onClick={openPopup}
          variant="contained"
          style={{
            borderRadius: "50%", // Circular shape
            width: "2.5rem", // Smaller size
            height: "2.5rem", // Smaller size
            fontSize: "1.5rem", // Bigger "+" for better balance
            minWidth: "unset", // Prevents default Material-UI width
            padding: 0, // Ensures content is centered
            lineHeight: 1, // Prevents vertical misalignment
          }}
        >
          +
        </Button>
      </div>
    </div>
  );
}


    // <div className="App">
    //   <Header />
    //   <div className="main">
    //     <div>
    //       <SelectOption
    //         onClick={() => setActiveView('CPU')}
    //         title="CPU"
    //         view="CPU"
    //         subTitle={staticData?.cpuModel ?? ''}
    //         data={cpuUsages}
    //       />
    //       <SelectOption
    //         onClick={() => setActiveView('RAM')}
    //         title="RAM"
    //         view="RAM"
    //         subTitle={(staticData?.totalMemoryGB.toString() ?? '') + ' GB'}
    //         data={ramUsages}
    //       />
    //       <SelectOption
    //         onClick={() => setActiveView('STORAGE')}
    //         title="STORAGE"
    //         view="STORAGE"
    //         subTitle={(staticData?.totalStorage.toString() ?? '') + ' GB'}
    //         data={storageUsages}
    //       />
    //     </div>
    //     <div className="mainGrid">
    //       <Chart
    //         selectedView={activeView}
    //         data={activeUsages}
    //         maxDataPoints={10}
    //       />
    //     </div>
    //   </div>
    // </div>
  // );

function SelectOption(props: {
  title: string;
  view: View;
  subTitle: string;
  data: number[];
  onClick: () => void;
}) {
  return (
    <button className="selectOption" onClick={props.onClick}>
      <div className="selectOptionTitle">
        <div>{props.title}</div>
        <div>{props.subTitle}</div>
      </div>
      <div className="selectOptionChart">
        <Chart selectedView={props.view} data={props.data} maxDataPoints={10} />
      </div>
    </button>
  );
}

function Header() {
  return (
    <header>
      <button
        id="close"
        onClick={() => window.electron.sendFrameAction('CLOSE')}
      />
      <button
        id="minimize"
        onClick={() => window.electron.sendFrameAction('MINIMIZE')}
      />
      <button
        id="maximize"
        onClick={() => window.electron.sendFrameAction('MAXIMIZE')}
      />
    </header>
  );
}

function useStaticData() {
  const [staticData, setStaticData] = useState<StaticData | null>(null);

  useEffect(() => {
    (async () => {
      setStaticData(await window.electron.getStaticData());
    })();
  }, []);

  return staticData;
}

export default App;