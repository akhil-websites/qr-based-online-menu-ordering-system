import React from "react";
import { useParams, useSearchParams } from "react-router-dom";

const Category = () => {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const section = searchParams.get("section");

  return (
    <div>
      <h2>Category: {category}</h2>
      {section && <h3>Section: {section}</h3>}
    </div>
  );
};

export default Category;
