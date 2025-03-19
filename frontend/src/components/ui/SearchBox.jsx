"use client";

import { PlaceholdersAndVanishInput } from "./placeholder";

export function SearchBox() {
  const placeholders = [
    "هرچی میخوای جست و جو کن",
    "کامپیوتر میخوای بخری؟",
    "موبایل میخوای بخری؟",
    "لپ تاپ میخوای بخری؟",
    "تبلت میخوای بخری؟",
  ];

  const handleChange = (e) => {
    console.log(e.target.value);
  };
  const onSubmit = (e) => {
    e.preventDefault();
    console.log("submitted");
  };
  return (
    <PlaceholdersAndVanishInput
      placeholders={placeholders}
      onChange={handleChange}
      onSubmit={onSubmit}
    />
  );
}
