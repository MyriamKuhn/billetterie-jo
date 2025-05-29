export interface ProductDetails {
  places: number;
  description: string;
  image: string;
  date: string;
  time: string;
  location: string;
  category: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  sale: number;
  stock_quantity: number;
  product_details: ProductDetails;
}
