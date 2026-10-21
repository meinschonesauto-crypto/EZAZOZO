// Petit bus d'événements pour relier les boutons « Ajouter » des sections au module de commande.
export const CART_ADD_EVENT = 'ezazozo:cart-add';

export const addToCart = (id: string) => {
  window.dispatchEvent(new CustomEvent<string>(CART_ADD_EVENT, { detail: id }));
};
