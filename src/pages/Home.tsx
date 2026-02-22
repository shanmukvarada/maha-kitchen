import React from 'react';
import { BannerCarousel } from '../components/BannerCarousel';
import { ProductList } from '../components/ProductList';

export const Home = () => {
  return (
    <div>
      <BannerCarousel />
      <ProductList />
    </div>
  );
};
