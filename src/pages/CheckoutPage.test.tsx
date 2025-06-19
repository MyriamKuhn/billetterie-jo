import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import CheckoutPage from './CheckoutPage';
import * as paymentService from '../services/paymentService';
import * as stripeReact from '@stripe/react-stripe-js';
import { logError, logWarn } from '../utils/logger';

const mockUseElements = vi.fn(() => ({
  getElement: (_: any) => ({ /* un objet truthy par défaut */ }),
}));

// ─── Mocks globaux ────────────────────────────────────────────────────────────────

// 1. Mock useTranslation
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string, _opts?: any) => key,
  }),
}));

// 2. Mock useLanguageStore
vi.mock('../stores/useLanguageStore', () => ({
  __esModule: true,
  useLanguageStore: (selector: any) => selector({ lang: 'en' }),
}));

// 3. Mock useAuthStore, closure sur mockAuthToken
let mockAuthToken: string | null = 'token123';
vi.mock('../stores/useAuthStore', () => ({
  __esModule: true,
  useAuthStore: (selector: any) => selector({ authToken: mockAuthToken }),
}));

// 4. Mock useCartStore, closure sur mockCartId et méthodes
const mockLoadCart = vi.fn();
const mockClearCart = vi.fn();
const mockLockCart = vi.fn();
const mockUnlockCart = vi.fn();
let mockCartId: string | null = 'cart-1';

vi.mock('../stores/useCartStore', () => ({
  __esModule: true,
  useCartStore: vi.fn((selector: any) => {
    const state = {
      loadCart: mockLoadCart,
      clearCart: mockClearCart,
      lockCart: mockLockCart,
      unlockCart: mockUnlockCart,
      cartId: mockCartId,
    };
    return selector(state);
  }),
}));

// 5. Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual: any = await vi.importActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// 6. Mock Stripe hooks
const mockConfirmCardPayment = vi.fn();
vi.mock('@stripe/react-stripe-js', () => ({
  __esModule: true,
  useStripe: () => ({ confirmCardPayment: mockConfirmCardPayment }),
  useElements: () => mockUseElements(),
  CardElement: () => <div data-testid="card-element" />,
  Elements: (props: any) => <div>{props.children}</div>,
}));

// 7. Mock loadStripe
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: () => Promise.resolve({} as any),
}));

// 8. Mock services paymentService
vi.mock('../services/paymentService', () => ({
  __esModule: true,
  createPayment: vi.fn(),
  getPaymentStatus: vi.fn(),
}));

// 9. Mock utils logger
vi.mock('../utils/logger', () => ({
  __esModule: true,
  logError: vi.fn(),
  logWarn: vi.fn(),
  logInfo: vi.fn(),
}));

// 10. Mock getErrorMessage
vi.mock('../utils/errorUtils', () => ({
  __esModule: true,
  getErrorMessage: (_t: any, code: string) => `error:${code}`,
}));

// 11. Mock composants simples
vi.mock('../components/Seo', () => ({
  __esModule: true,
  default: ({ title, description }: any) => (
    <div data-testid="seo" data-title={title} data-description={description} />
  ),
}));
vi.mock('../components/PageWrapper', () => ({
  __esModule: true,
  PageWrapper: ({ children }: any) => <div data-testid="page-wrapper">{children}</div>,
}));
vi.mock('../components/OlympicLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader">Loading...</div>,
}));
vi.mock('../components/AlertMessage', () => ({
  __esModule: true,
  default: ({ message, severity }: any) => <div data-testid={`alert-${severity}`}>{message}</div>,
}));

// ─── Tests ────────────────────────────────────────────────────────────────────────
describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // On garantit que loadCart renvoie bien une Promise résolue
    mockLoadCart.mockReset();
    mockLoadCart.mockResolvedValue(undefined);

    mockClearCart.mockReset();
    mockLockCart.mockReset();
    mockUnlockCart.mockReset();
    mockNavigate.mockReset();
    mockConfirmCardPayment.mockReset();
    (paymentService.createPayment as Mock).mockReset();
    (paymentService.getPaymentStatus as Mock).mockReset();

    // Remise à jour des variables de closure pour les mocks
    mockAuthToken = 'token123';
    mockCartId = 'cart-1';
  });

  afterEach(() => {
    // Rien de spécial ici, on n’utilise pas fakeTimers
  });

  it('si pas de token, setErrorInit et navigue vers login', async () => {
    mockAuthToken = null;
    mockCartId = null;

    render(<CheckoutPage />);

    await waitFor(() => {
      const alert = screen.getByTestId('alert-error');
      expect(alert).toHaveTextContent('errors.not_authenticated');
      expect(mockNavigate).toHaveBeenCalledWith('/login?next=/checkout');
    });
  });

  it('si token présent mais pas de cartId, appelle loadCart() et affiche loader panier', async () => {
    mockAuthToken = 'token123';
    mockCartId = null;

    render(<CheckoutPage />);

    // Attendre l’appel de loadCart
    await waitFor(() => {
      expect(mockLoadCart).toHaveBeenCalled();
    });
    // Puis loader + texte initializing
    expect(screen.getByTestId('loader')).toBeInTheDocument();
    expect(screen.getByText('checkout.initializing')).toBeInTheDocument();
  });

  it('initialise paiement avec createPayment succès, puis rend formulaire', async () => {
    mockAuthToken = 'token123';
    mockCartId = 'cart-42';
    (paymentService.createPayment as Mock).mockResolvedValue({
      data: { client_secret: 'secret-123', uuid: 'uuid-123' },
    });

    render(<CheckoutPage />);

    // Attendre l’appel createPayment
    await waitFor(() => {
      expect(paymentService.createPayment).toHaveBeenCalledWith('cart-42', 'token123', 'en');
    });
    // Puis formulaire
    await waitFor(() => {
      expect(screen.getByText('checkout.title')).toBeInTheDocument();
      expect(screen.getByTestId('card-element')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'checkout.pay_button' })).toBeInTheDocument();
    });
  });

  it('initialise paiement échoue avec axios error code → affiche message d’erreur init', async () => {
    mockAuthToken = 'token123';
    mockCartId = 'cart-99';
    const err: any = new Error('fail');
    err.isAxiosError = true;
    err.response = { data: { code: 'SOME_CODE' } };
    (paymentService.createPayment as Mock).mockRejectedValue(err);

    render(<CheckoutPage />);

    await waitFor(() => {
      expect(paymentService.createPayment).toHaveBeenCalled();
    });
    await waitFor(() => {
      const alert = screen.getByTestId('alert-error');
      expect(alert).toHaveTextContent('error:SOME_CODE');
    });
  });

  it('handleSubmit: stripe.confirmCardPayment error → affiche erreur card_error et unlockCart', async () => {
    mockAuthToken = 'token123';
    mockCartId = 'cart-123';
    (paymentService.createPayment as Mock).mockResolvedValue({
      data: { client_secret: 'sec', uuid: 'uuid-xyz' },
    });
    mockConfirmCardPayment.mockResolvedValue({ error: { message: 'card invalid' } });

    render(<CheckoutPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'checkout.pay_button' })).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'checkout.pay_button' }));
      // L’erreur survient avant polling, donc pas d’attente supplémentaire
    });

    await waitFor(() => {
      const alert = screen.getByTestId('alert-error');
      expect(alert).toHaveTextContent('errors.card_error');
      expect(mockUnlockCart).toHaveBeenCalled();
    });
  });

  it('handleSubmit: succès et getPaymentStatus succeeded → clearCart et navigate confirmation', async () => {
    mockAuthToken = 'token123';
    mockCartId = 'cart-777';
    (paymentService.createPayment as any).mockResolvedValue({
      data: { client_secret: 'sec-777', uuid: 'uuid-777' },
    });
    mockConfirmCardPayment.mockResolvedValue({ error: null });
    (paymentService.getPaymentStatus as any).mockResolvedValue({
      status: 200,
      data: { status: 'succeeded' },
    });

    render(<CheckoutPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'checkout.pay_button' })).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'checkout.pay_button' }));
      // Grâce à POLLING_DELAY_MS = 0 en test, la boucle de polling continue et termine immédiatement
    });

    await waitFor(() => {
      expect(mockClearCart).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/confirmation', { state: { paymentUuid: 'uuid-777' } });
    });
  });

  it('handleSubmit: succès mais getPaymentStatus failed → affiche erreur payment_failed et unlockCart', async () => {
    mockAuthToken = 'token123';
    mockCartId = 'cart-888';
    (paymentService.createPayment as any).mockResolvedValue({
      data: { client_secret: 'sec-888', uuid: 'uuid-888' },
    });
    mockConfirmCardPayment.mockResolvedValue({ error: null });
    (paymentService.getPaymentStatus as any).mockResolvedValue({
      status: 200,
      data: { status: 'failed' },
    });

    render(<CheckoutPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'checkout.pay_button' })).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'checkout.pay_button' }));
    });

    await waitFor(() => {
      expect(screen.getByTestId('alert-error')).toHaveTextContent('errors.payment_failed');
      expect(mockUnlockCart).toHaveBeenCalled();
    });
    expect(mockNavigate).not.toHaveBeenCalledWith('/confirmation', expect.anything());
  });

  it('handleSubmit: polling error 401 → errorPayment not_authenticated et navigate login, unlockCart', async () => {
    mockAuthToken = 'token123';
    mockCartId = 'cart-999';
    (paymentService.createPayment as any).mockResolvedValue({
      data: { client_secret: 'sec-999', uuid: 'uuid-999' },
    });
    mockConfirmCardPayment.mockResolvedValue({ error: null });
    const pollErr: any = new Error('unauthorized');
    pollErr.isAxiosError = true;
    pollErr.response = { status: 401 };
    (paymentService.getPaymentStatus as any).mockRejectedValue(pollErr);

    render(<CheckoutPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'checkout.pay_button' })).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'checkout.pay_button' }));
    });

    await waitFor(() => {
      const alert = screen.getByTestId('alert-error');
      expect(alert).toHaveTextContent('errors.not_authenticated');
      expect(mockUnlockCart).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('au démontage, unlockCart est appelé', async () => {
    mockAuthToken = 'token123';
    mockCartId = 'cart-321';
    (paymentService.createPayment as Mock).mockResolvedValue({
      data: { client_secret: 'sec-321', uuid: 'uuid-321' },
    });
    mockConfirmCardPayment.mockResolvedValue({ error: null });
    (paymentService.getPaymentStatus as Mock).mockResolvedValue({
      status: 200,
      data: { status: 'succeeded' },
    });

    const { unmount } = render(<CheckoutPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'checkout.pay_button' })).toBeInTheDocument();
    });
    mockUnlockCart.mockReset();
    unmount();
    expect(mockUnlockCart).toHaveBeenCalled();
  });

  it('initialise paiement échoue (Axios sans code) → affiche generic_error', async () => {
    mockAuthToken = 'token123';
    mockCartId = 'cart-101';
    const err: any = new Error('oops');
    err.isAxiosError = true;
    err.response = { data: {} };           // PAS de .code
    (paymentService.createPayment as Mock).mockRejectedValue(err);

    render(<CheckoutPage />);
    await waitFor(() => {
      const alert = screen.getByTestId('alert-error');
      expect(alert).toHaveTextContent('error:generic_error');
    });
  });

  it('initialise paiement échoue (non-Axios) → affiche network_error', async () => {
    mockAuthToken = 'token123';
    mockCartId = 'cart-102';
    // rejet d’une erreur classique
    (paymentService.createPayment as Mock).mockRejectedValue(new Error('boom'));

    render(<CheckoutPage />);
    await waitFor(() => {
      const alert = screen.getByTestId('alert-error');
      expect(alert).toHaveTextContent('error:network_error');
    });
  });

  it('initialise paiement réponse inattendue sans client_secret → affiche network_error', async () => {
    mockAuthToken = 'token123';
    mockCartId = 'cart-103';
    // resolve sans client_secret
    (paymentService.createPayment as Mock).mockResolvedValue({ data: {} });

    render(<CheckoutPage />);
    await waitFor(() => {
      const alert = screen.getByTestId('alert-error');
      expect(alert).toHaveTextContent('error:network_error');
    });
  });

  it('handleSubmit: pas de CardElement → affiche no_card_element et unlockCart', async () => {
    mockAuthToken = 'token123';
    mockCartId   = 'cart-1234';
    // initialisation OK
    (paymentService.createPayment as Mock).mockResolvedValue({
      data: { client_secret: 'sec-x', uuid: 'uuid-x' },
    });
    // on simule aucun élément de carte
    mockUseElements.mockReturnValue({ getElement: (_: any): any => null, });

    render(<CheckoutPage />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'checkout.pay_button' })).toBeInTheDocument()
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'checkout.pay_button' }));
    });

    await waitFor(() => {
      const alert = screen.getByTestId('alert-error');
      expect(alert).toHaveTextContent('errors.no_card_element');
      expect(mockUnlockCart).toHaveBeenCalled();
    });
  });
});

describe('CheckoutPage – branches manquantes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (paymentService.getPaymentStatus as Mock).mockResolvedValue({
      status: 200,
      data: { status: 'succeeded' },
    });
    mockUseElements.mockReturnValue({ getElement: () => ({}) });
    (paymentService.createPayment as Mock).mockResolvedValue({
      data: { client_secret: 'sec-123', uuid: 'uuid-123' },
    });
    mockConfirmCardPayment.mockResolvedValue({ error: null });
    mockUnlockCart.mockReset();
  });

  it('handleSubmit: pas de CardElement → affiche no_card_element et unlockCart', async () => {
    // on simule useElements.getElement() qui retourne null
    vi.spyOn(stripeReact, 'useElements').mockReturnValue({ getElement: () => null } as any);
    render(<CheckoutPage />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'checkout.pay_button' })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: 'checkout.pay_button' }));
    await waitFor(() => {
      expect(screen.getByTestId('alert-error')).toHaveTextContent('errors.no_card_element');
      expect(mockUnlockCart).toHaveBeenCalled();
    });
  });

  it('init error → retry et back_to_cart buttons', async () => {
    // forcer createPayment en échec pour déclencher l’erreur init
    const err: any = new Error();
    err.isAxiosError = true;
    err.response = { data: { code: 'INIT_ERR' } };
    (paymentService.createPayment as Mock).mockRejectedValue(err);

    render(<CheckoutPage />);
    await waitFor(() => screen.getByTestId('alert-error'));

    // spy sur window.location.reload
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: vi.fn() }
    });

    // retry
    fireEvent.click(screen.getByRole('button', { name: 'checkout.retry' }));
    expect(window.location.reload).toHaveBeenCalled();

    // back to cart
    fireEvent.click(screen.getByRole('button', { name: 'checkout.back_to_cart' }));
    expect(mockNavigate).toHaveBeenCalledWith('/cart');
  });

  it('handleSubmit : getPaymentStatus renvoie un status non-200 → affiche payment_failed et unlockCart', async () => {
    // 1) Forcer useElements() à renvoyer un élément de carte
    vi.spyOn(stripeReact, 'useElements').mockReturnValue({ getElement: () => ({}) } as any);

    // 2) Prépare les mocks
    mockAuthToken = 'token123';
    mockCartId   = 'cart-500';
    (paymentService.createPayment as Mock).mockResolvedValue({
      data: { client_secret: 'sec-500', uuid: 'uuid-500' },
    });
    mockConfirmCardPayment.mockResolvedValue({ error: null });
    // Statut HTTP non-200 et data null → throw
    (paymentService.getPaymentStatus as Mock).mockResolvedValue({
      status: 500,
      data: null,
    });

    render(<CheckoutPage />);

    // 3) Attendre le bouton prêt
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'checkout.pay_button' })).toBeEnabled()
    );

    // 4) Cliquer sur "Payer"
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'checkout.pay_button' }));
    });

    // 5) Vérifier qu'on affiche bien "errors.payment_failed" et qu'on a unlockCart()
    await waitFor(() => {
      const alert = screen.getByTestId('alert-error');
      expect(alert).toHaveTextContent('errors.payment_failed');
      expect(mockUnlockCart).toHaveBeenCalled();
    });

    // Et on ne navigue pas vers la confirmation
    expect(mockNavigate).not.toHaveBeenCalledWith('/confirmation', expect.anything());
  });

  it('handleSubmit : polling rejette une AxiosError avec response.data.code → exécute la branche code puis affiche payment_failed et unlockCart', async () => {
    // 0) On rétablit useElements() pour retourner un CardElement valide
    vi.spyOn(stripeReact, 'useElements').mockReturnValue({ getElement: () => ({}) } as any);

    // 1) Mocks pour aller jusqu’au polling
    mockAuthToken = 'token123';
    mockCartId   = 'cart-999';
    (paymentService.createPayment as Mock).mockResolvedValue({
      data: { client_secret: 'sec-999', uuid: 'uuid-999' },
    });
    mockConfirmCardPayment.mockResolvedValue({ error: null });

    // 2) On fait rejeter getPaymentStatus avec une AxiosError contenant un code
    const pollErr: any = new Error('poll failed');
    pollErr.isAxiosError = true;
    pollErr.response = { data: { code: 'POLL_ERROR_CODE' } };
    (paymentService.getPaymentStatus as Mock).mockRejectedValue(pollErr);

    // 3) On render, attend le formulaire prêt
    render(<CheckoutPage />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'checkout.pay_button' })).toBeEnabled()
    );

    // 4) On clique sur “Payer”
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'checkout.pay_button' }));
    });

    // 5) On attend l’alerte finale et on vérifie unlockCart
    await waitFor(() => {
      const alert = screen.getByTestId('alert-error');
      // Comme le code est surchargé par l’else final, on reçoit errors.payment_failed
      expect(alert).toHaveTextContent('errors.payment_failed');
      expect(mockUnlockCart).toHaveBeenCalled();
    });

    // On ne navigue ni vers /login ni vers /confirmation
    expect(mockNavigate).not.toHaveBeenCalledWith('/login');
    expect(mockNavigate).not.toHaveBeenCalledWith('/confirmation', expect.anything());
  });

  it('handleSubmit : clearCart échoue → logError est appelé puis navigate confirmation', async () => {
    // 0) On mocke un CardElement valide
    vi.spyOn(stripeReact, 'useElements').mockReturnValue({ getElement: () => ({}) } as any);

    // 1) Initialisation du token, cartId et des services Stripe/payment
    mockAuthToken = 'token123';
    mockCartId   = 'cart-321';
    (paymentService.createPayment as Mock).mockResolvedValue({
      data: { client_secret: 'sec-321', uuid: 'uuid-321' },
    });
    mockConfirmCardPayment.mockResolvedValue({ error: null });
    (paymentService.getPaymentStatus as Mock).mockResolvedValue({
      status: 200,
      data: { status: 'succeeded' },
    });

    // 2) clearCart() rejette pour déclencher le catch
    mockClearCart.mockRejectedValue(new Error('clear failure'));

    // 3) On render et on clique sur Payer
    render(<CheckoutPage />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'checkout.pay_button' })).toBeEnabled()
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'checkout.pay_button' }));
    });

    // 4) On vérifie que logError a bien été appelé avec le message et l’erreur,
    //    et qu’on navigue toujours vers /confirmation
    await waitFor(() => {
      expect(logError).toHaveBeenCalledWith(
        'clearCart error after payment:',
        expect.any(Error)
      );
      expect(mockNavigate).toHaveBeenCalledWith('/confirmation', {
        state: { paymentUuid: 'uuid-321' },
      });
    });
  });

  it('handleSubmit : confirmCardPayment throws → logError, reset processing/pollingStatus et unlockCart', async () => {
    // 0) Forcer useElements() à retourner un CardElement valide
    vi.spyOn(stripeReact, 'useElements').mockReturnValue({ getElement: () => ({}) } as any);

    // 1) Prépare token, cartId et createPayment
    mockAuthToken = 'token123';
    mockCartId   = 'cart-abc';
    (paymentService.createPayment as Mock).mockResolvedValue({
      data: { client_secret: 'sec-abc', uuid: 'uuid-abc' },
    });

    // 2) Faire échouer confirmCardPayment
    mockConfirmCardPayment.mockRejectedValue(new Error('stripe error'));

    // 3) Rendu et attente du bouton
    render(<CheckoutPage />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'checkout.pay_button' })).toBeEnabled()
    );

    // 4) Clic sur "Payer"
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'checkout.pay_button' }));
    });

    // 5) On doit tomber dans le catch, vérifier logError et unlockCart,
    //    et s’assurer que le bouton est de nouveau activé (processing=false et pollingStatus=false)
    await waitFor(() => {
      expect(logError).toHaveBeenCalledWith(
        'Checkout:confirmCardPayment error',
        expect.any(Error)
      );
      expect(mockUnlockCart).toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'checkout.pay_button' })).toBeEnabled();
    });
  });

  it('cancel payment button: calls unlockCart and navigates to /cart', async () => {
    // 1) Forcer un CardElement valide
    vi.spyOn(stripeReact, 'useElements').mockReturnValue({ getElement: () => ({}) } as any);

    // 2) Préparer createPayment pour arriver au rendu du formulaire
    mockAuthToken = 'token123';
    mockCartId   = 'cart-cancel';
    (paymentService.createPayment as Mock).mockResolvedValue({
      data: { client_secret: 'sec-cancel', uuid: 'uuid-cancel' },
    });

    // 3) Rendu et attente que le bouton de paiement soit là
    render(<CheckoutPage />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'checkout.pay_button' })).toBeInTheDocument()
    );

    // 4) Cliquer sur le bouton “Annuler le paiement”
    fireEvent.click(screen.getByRole('button', { name: 'checkout.cancel_payment' }));

    // 5) Vérifier unlockCart et navigation vers /cart
    expect(mockUnlockCart).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/cart');
  });

  it('handleSubmit : getPaymentStatus renvoie requires_payment_method → affiche payment_failed et unlockCart', async () => {
    // 1) Forcer un CardElement valide
    vi.spyOn(stripeReact, 'useElements').mockReturnValue({ getElement: () => ({}) } as any);

    // 2) Préparer token, cartId et createPayment
    mockAuthToken = 'token123';
    mockCartId   = 'cart-req';
    (paymentService.createPayment as Mock).mockResolvedValue({
      data: { client_secret: 'sec-req', uuid: 'uuid-req' },
    });
    mockConfirmCardPayment.mockResolvedValue({ error: null });

    // 3) getPaymentStatus renvoie status 200 mais data.status = 'requires_payment_method'
    (paymentService.getPaymentStatus as Mock).mockResolvedValue({
      status: 200,
      data: { status: 'requires_payment_method' },
    });

    // 4) Render et attendre le bouton Pay
    render(<CheckoutPage />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'checkout.pay_button' })).toBeEnabled()
    );

    // 5) Cliquer sur "Payer"
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'checkout.pay_button' }));
    });

    // 6) Vérifier l’alerte payment_failed et unlockCart
    await waitFor(() => {
      const alert = screen.getByTestId('alert-error');
      expect(alert).toHaveTextContent('errors.payment_failed');
      expect(mockUnlockCart).toHaveBeenCalled();
    });

    // Pas de navigation vers la confirmation
    expect(mockNavigate).not.toHaveBeenCalledWith('/confirmation', expect.anything());
  });

  it('handleSubmit : getPaymentStatus renvoie canceled → affiche payment_failed et unlockCart', async () => {
    // 1) Forcer un CardElement valide
    vi.spyOn(stripeReact, 'useElements').mockReturnValue({ getElement: () => ({}) } as any);

    // 2) Préparer token, cartId et createPayment
    mockAuthToken = 'token123';
    mockCartId   = 'cart-req';
    (paymentService.createPayment as Mock).mockResolvedValue({
      data: { client_secret: 'sec-req', uuid: 'uuid-req' },
    });
    mockConfirmCardPayment.mockResolvedValue({ error: null });

    // 3) getPaymentStatus renvoie status 200 mais data.status = 'requires_payment_method'
    (paymentService.getPaymentStatus as Mock).mockResolvedValue({
      status: 200,
      data: { status: 'canceled' }
    });

    // 4) Render et attendre le bouton Pay
    render(<CheckoutPage />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'checkout.pay_button' })).toBeEnabled()
    );

    // 5) Cliquer sur "Payer"
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'checkout.pay_button' }));
    });

    // 6) Vérifier l’alerte payment_failed et unlockCart
    await waitFor(() => {
      const alert = screen.getByTestId('alert-error');
      expect(alert).toHaveTextContent('errors.payment_failed');
      expect(mockUnlockCart).toHaveBeenCalled();
    });

    // Pas de navigation vers la confirmation
    expect(mockNavigate).not.toHaveBeenCalledWith('/confirmation', expect.anything());
  });

  it('loadCart error → logWarn is called', async () => {
    mockAuthToken = 'token123';
    mockCartId = null;
    // Faire échouer loadCart
    mockLoadCart.mockRejectedValueOnce(new Error('load failure'));

    render(<CheckoutPage />);

    await waitFor(() => {
      expect(mockLoadCart).toHaveBeenCalled();
      expect(logWarn).toHaveBeenCalledWith(
        'Checkout:load cart',
        expect.any(Error)
      );
    });
  });

  it('handleSubmit: getPaymentStatus returns pending then succeeded → clearCart et navigate', async () => {
    vi.spyOn(stripeReact, 'useElements').mockReturnValue({ getElement: () => ({}) } as any);

    mockAuthToken = 'token123';
    mockCartId = 'cart-pend';
    (paymentService.createPayment as Mock).mockResolvedValue({
      data: { client_secret: 'sec-pend', uuid: 'uuid-pend' },
    });
    mockConfirmCardPayment.mockResolvedValue({ error: null });
    // 1er tour : pending, 2e tour : succeeded
    (paymentService.getPaymentStatus as Mock)
      .mockResolvedValueOnce({ status: 200, data: { status: 'pending' } })
      .mockResolvedValueOnce({ status: 200, data: { status: 'succeeded' } });

    render(<CheckoutPage />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'checkout.pay_button' })).toBeEnabled()
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'checkout.pay_button' }));
    });

    await waitFor(() => {
      expect(mockClearCart).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/confirmation', {
        state: { paymentUuid: 'uuid-pend' },
      });
    });
  });

  it('dynamic import under production NODE_ENV covers POLLING_DELAY_MS = 2000 branch', async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    // on importe à nouveau le module : la ternaire est évaluée sur 2000
    const mod = await import('./CheckoutPage');
    expect(mod.default).toBeDefined();
    // restore
    process.env.NODE_ENV = prev;
    vi.resetModules();
  });

});