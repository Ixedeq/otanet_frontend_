import React from "react";
import SearchBox from "./components/Searchbox";
import Logo from "./components/Logo";
import MenuBox from "./components/MenuBox";
import "../css/Header.css";

export default function Header() {
  return (
    <header>
      <SearchBox />
      <Logo />
      <MenuBox />
    </header>
  );
}


