import { useEffect, useMemo, useState } from 'react';
import reactLogo from './assets/react.svg';
import './App.css';
import { useStatistics } from './useStatistics';
import { Chart } from './Chart';
import Button from '@mui/material/Button';
import { styled } from "@mui/material/styles";
import { Box, Fab } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import logoImage from "./assets/logo.png";
import ConnectionsGrid from "./components/ConnectionsGrid";

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
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);

  useEffect(() => {
    // Fetch initial connections on app load
    window.electron.getConnections().then((initialConnections) => {
      console.log("getting initial connections");
      setConnections(initialConnections);
    });

    // Listen for updates from the main process
    const unsubscribe = window.electron.on("connectionsUpdated", (updatedConnections) => {
      console.log("Connections updated:", updatedConnections);
      setConnections(updatedConnections);
    });

    // Cleanup listener on component unmount
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        justifyContent: "space-between",
        position: "relative", // For floating button positioning
      }}
    >
      {/* Top Header Section */}
      <img
          src={logoImage}
          alt="App Logo"
          style={{
            height: "80px",
          }}
        />

      {/* Connections Grid */}
      <ConnectionsGrid 
  connections={connections} 
  onOpenDatabase={(connection) => {
    console.log("Opening database for connection:", connection);
    window.electron.send("openDatabaseWindow", connection); // Send event to open a new database window
  }} 
/>

      {/* Floating Add Button */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={openPopup}
        sx={{
          position: "absolute",
          bottom: "2rem",
          right: "2rem",
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
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