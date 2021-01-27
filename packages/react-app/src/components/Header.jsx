import React from "react";
import { Image, PageHeader } from "antd";
// import { WatchfulEye } from "../index";

export default function Header() {
  return (
    <a href="https://github.com/conjohnerton/watchful-eye" target="_blank" rel="noopener noreferrer">
      <PageHeader
        title="👁️ Watchful Eye"
        subTitle="keeps a watchful eye on your loans... uses Aave flashloans to self-liquidate in case things go downhill ⛷️"
        style={{ cursor: "pointer" }}
        backIcon={<Image src="%PUBLIC_URL%/WatchfulEye.png" />}
      />
    </a>
  );
}
