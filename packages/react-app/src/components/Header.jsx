import React from "react";
import { PageHeader } from "antd";

export default function Header() {
  return (
    <a href="https://github.com/conjohnerton/liqui-bot" target="_blank" rel="noopener noreferrer">
      <PageHeader
        title="🫖 Liqui-bot"
        subTitle="a peace-of-mind bot that uses Aave flashloans to self-liquidate in case things go downhill ⛷️"
        style={{ cursor: "pointer" }}
      />
    </a>
  );
}
