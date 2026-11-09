import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { Outlet } from 'react-router';

import {
  Address,
  ColorId,
  Coupon,
  COUPONS,
  FREE_SHIPPING_FROM,
  Product,
  SEED_ADDRESSES,
  SEED_PRODUCTS,
  SHIPPING,
  ShippingId
} from './data';

export interface CartItem {
  /** produto + cor + tamanho: o mesmo produto em outra cor é outra linha. */
  key: string;
  productId: number;
  cor: ColorId;
  tamanho?: string;
  qtd: number;
}

export interface Totals {
  itens: number;
  subtotal: number;
  desconto: number;
  frete: number;
  total: number;
}

interface StoreApi {
  products: Product[];
  saveProduct: (p: Product) => void;
  removeProducts: (ids: number[]) => void;
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'key'>) => void;
  setQty: (key: string, qtd: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
  coupon?: Coupon;
  applyCoupon: (codigo: string) => string | undefined;
  removeCoupon: () => void;
  shipping: ShippingId;
  setShipping: (s: ShippingId) => void;
  addresses: Address[];
  saveAddress: (a: Address) => void;
  removeAddress: (id: number) => void;
  totals: Totals;
}

const StoreContext = createContext<StoreApi | null>(null);

function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState(SEED_PRODUCTS);
  // carrinho começa com dois itens para o checkout já ter o que mostrar
  const [cart, setCart] = useState<CartItem[]>([
    { key: '1-preto', productId: 1, cor: 'preto', qtd: 1 },
    { key: '3-azul-41', productId: 3, cor: 'azul', tamanho: '41', qtd: 1 }
  ]);
  const [coupon, setCoupon] = useState<Coupon>();
  const [shipping, setShipping] = useState<ShippingId>('padrao');
  const [addresses, setAddresses] = useState(SEED_ADDRESSES);

  const api = useMemo<StoreApi>(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    const lines = cart.filter((i) => byId.has(i.productId));
    const subtotal = lines.reduce((acc, i) => acc + byId.get(i.productId)!.preco * i.qtd, 0);
    const validCoupon = coupon && (!coupon.minimo || subtotal >= coupon.minimo) ? coupon : undefined;
    const desconto = validCoupon ? Math.min(subtotal, validCoupon.desconto(subtotal)) : 0;
    const freeStandard = subtotal >= FREE_SHIPPING_FROM || !!validCoupon?.freteGratis;
    const frete = lines.length === 0 ? 0 : shipping === 'padrao' && freeStandard ? 0 : SHIPPING[shipping].preco;

    return {
      products,
      saveProduct: (p) =>
        setProducts((list) => (list.some((x) => x.id === p.id) ? list.map((x) => (x.id === p.id ? p : x)) : [p, ...list])),
      removeProducts: (ids) => {
        setProducts((list) => list.filter((p) => !ids.includes(p.id)));
        setCart((c) => c.filter((i) => !ids.includes(i.productId)));
      },
      cart: lines,
      addToCart: (item) => {
        const key = [item.productId, item.cor, item.tamanho].filter(Boolean).join('-');
        setCart((c) =>
          c.some((i) => i.key === key) ? c.map((i) => (i.key === key ? { ...i, qtd: i.qtd + item.qtd } : i)) : [...c, { ...item, key }]
        );
      },
      setQty: (key, qtd) => setCart((c) => c.map((i) => (i.key === key ? { ...i, qtd: Math.max(1, qtd) } : i))),
      removeFromCart: (key) => setCart((c) => c.filter((i) => i.key !== key)),
      clearCart: () => {
        setCart([]);
        setCoupon(undefined);
      },
      coupon: validCoupon,
      applyCoupon: (codigo) => {
        const found = COUPONS.find((c) => c.codigo === codigo.trim().toUpperCase());
        if (!found) return 'Cupom não encontrado.';
        if (found.minimo && subtotal < found.minimo) return `Válido para compras a partir de R$ ${found.minimo}.`;
        setCoupon(found);
        return undefined;
      },
      removeCoupon: () => setCoupon(undefined),
      shipping,
      setShipping,
      addresses,
      saveAddress: (a) =>
        setAddresses((list) => (list.some((x) => x.id === a.id) ? list.map((x) => (x.id === a.id ? a : x)) : [...list, a])),
      removeAddress: (id) => setAddresses((list) => list.filter((a) => a.id !== id)),
      totals: { itens: lines.reduce((acc, i) => acc + i.qtd, 0), subtotal, desconto, frete, total: subtotal - desconto + frete }
    };
  }, [products, cart, coupon, shipping, addresses]);

  return <StoreContext value={api}>{children}</StoreContext>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore fora do StoreProvider');
  return ctx;
}

/** Rota-mãe da loja: catálogo, carrinho e endereços ficam vivos enquanto se navega entre as telas. */
export default function LojaLayout() {
  return (
    <StoreProvider>
      <Outlet />
    </StoreProvider>
  );
}
