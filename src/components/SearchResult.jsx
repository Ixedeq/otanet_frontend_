import { useLocation } from "react-router-dom";

export default function SearchResult() {
   const location = useLocation();
   const { searchValue } = location.state;

 return (
    <div>{searchValue}</div>
 )   
}