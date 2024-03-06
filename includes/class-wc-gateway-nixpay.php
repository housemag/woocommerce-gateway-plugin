<?php
/**
 * WC_Gateway_NixPay class
 *
 * @author   cavalheiroDev <ga3-cavalheiro@hotmail.com>
 * @package  WooCommerce NixPay Payments Gateway
 * @since    1.0.0
 */

// Exit if accessed directly.
if (!defined('ABSPATH')) {
    exit;
}

/**
 * NixPay Gateway.
 *
 * @class    WC_Gateway_NixPay
 * @version  1.0.7
 */
class WC_Gateway_NixPay extends WC_Payment_Gateway
{

    /**
     * Payment gateway instructions.
     * @var string
     *
     */
    protected $instructions;

    /**
     * Unique id for the gateway.
     * @var string
     *
     */
    public $id = 'nixpay';
    public const WEBHOOK_ENDPOINT = 'NIX-PAY-CREDIT-WEBHOOK';

    public $woocommerce;
    public $title;
    public $description;
    public $signature_item_id;
    public $recurrence_plan_id;
    public $production_api_user;
    public $production_api_password;
    public $test_mode;
    public $test_api_user;
    public $test_api_password;
    public string $cadun_url;
    public string $base_url;
    public $cadun_user;
    public $cadun_password;
    public string $card_payments_url;


    /**
     * Constructor for the gateway.
     */
    public function __construct()
    {
        global $woocommerce;

        $this->woocommerce = $woocommerce;
        $this->icon = apply_filters('woocommerce_nixpay_gateway_icon', '');
        $this->has_fields = false;
        $this->supports = array(
            'products',
            'subscription',
            'subscriptions',
            'subscription_cancellation',
            'subscription_suspension',
            'subscription_reactivation',
            'subscription_amount_changes',
            'subscription_date_changes',
            'multiple_subscriptions'
        );

        $this->method_title = _x('NixPay Payment', 'NixPay payment method', 'woocommerce-gateway-nixpay');
        $this->method_description = __('Allows NixPay payments.', 'woocommerce-gateway-nixpay');

        // Load the settings.
        $this->init_form_fields();
        $this->init_settings();

        // Define user set variables.
        $this->title = $this->get_option('title');
        $this->signature_item_id = $this->get_option('signature_item_id');
        $this->recurrence_plan_id = $this->get_option('recurrence_plan_id');

        $this->production_api_user = $this->get_option('production_api_user');
        $this->production_api_password = $this->get_option('production_api_password');

        $this->test_mode = $this->get_option('test_mode');
        $this->test_api_user = $this->get_option('test_api_user');
        $this->test_api_password = $this->get_option('test_api_password');

        $this->base_url = $this->test_mode ? 'https://apigateway-qa.nexxera.com' : 'https://apigateway.nexxera.com';

        $this->cadun_url = $this->base_url . '/nix/cadun/empresas/auth';
        $this->cadun_user = $this->test_mode ? $this->test_api_user : $this->production_api_user;
        $this->cadun_password = $this->test_mode ? $this->test_api_password : $this->production_api_password;

        $this->card_payments_url = $this->base_url . '/nix-pay/v2/Orders/CardPayments/Authorize';

        // Actions.
        add_action('woocommerce_update_options_payment_gateways_' . $this->id, array($this, 'process_admin_options'));
        add_action('woocommerce_scheduled_subscription_payment_nixpay', array($this, 'process_subscription_payment'), 10, 2);
        add_action('woocommerce_api_' . strtolower(self::WEBHOOK_ENDPOINT), [$this, 'webhook']);
    }

    /**
     * Initialise Gateway Settings Form Fields.
     */
    public function init_form_fields()
    {

        $this->form_fields = array(
            'enabled' => array(
                'title' => __('Ativo/Inativo', 'woocommerce-gateway-nixpay'),
                'type' => 'checkbox',
                'label' => __('Ativa o NixPay Payments', 'woocommerce-gateway-nixpay'),
                'default' => 'yes',
            ),
            'title' => array(
                'title' => __('Título', 'woocommerce-gateway-nixpay'),
                'type' => 'text',
                'description' => __('Isto controla o título que o usuário vê durante o checkout.', 'woocommerce-gateway-nixpay'),
                'default' => 'Cartão de Crédito',
                'desc_tip' => true,
            ),
            'signature_item_id' => array(
                'title' => __('ID do item de assinatura', 'woocommerce-gateway-nixpay'),
                'type' => 'text',
                'description' => 'Informe aqui o ID do produto no WooCommerce que será cadastrado para recorrência',
            ),
            'recurrence_plan_id' => array(
                'title' => __('ID do plano de recorrência Nix Empresas', 'woocommerce-gateway-nixpay'),
                'type' => 'text',
                'description' => 'Informe aqui o ID do plano cadastrado na plataforma NIX Empresa dentro de Gestão de Assinaturas > Planos'
            ),
            'production_api_user' => array(
                'title' => __('Usuário API de produção', 'woocommerce-gateway-nixpay'),
                'type' => 'text',
                'description' => 'Credenciais criadas dentro do Nix Empresa em configurações > Integração via API'
            ),
            'production_api_password' => array(
                'title' => __('Senha do usuário API de produção', 'woocommerce-gateway-nixpay'),
                'type' => 'password',
                'description' => 'Credenciais criadas dentro do Nix Empresa em configurações > Integração via API'
            ),
            'test_mode' => array(
                'title' => __('Modo de teste', 'woocommerce-gateway-nixpay'),
                'type' => 'checkbox',
                'description' => __('Habilita/Desabilita o modo de teste.', 'woocommerce-gateway-nixpay'),
            ),
            'test_api_user' => array(
                'title' => __('Usuário API de teste', 'woocommerce-gateway-nixpay'),
                'type' => 'text',
                'description' => 'Caso não tenha conta de teste, solicite em nosso suporte'
            ),
            'test_api_password' => array(
                'title' => __('Senha do usuário API de teste', 'woocommerce-gateway-nixpay'),
                'type' => 'password',
                'description' => 'Caso não tenha conta de teste, solicite em nosso suporte'
            )
        );
    }

    /**
     * Process the payment and return the result.
     *
     * @param int $order_id
     * @return array
     */
    public function process_payment($order_id)
    {
        error_log(print_r($_POST, true));
        $order = wc_get_order($order_id);

        $amount = number_format($order->get_total() * 100.0, 0, '.', '');

        $zip_code = str_replace('-', '', $order->get_billing_postcode());

        $merchant_order_id = wp_generate_uuid4();

        $payload = array(
            'merchantOrderId' => "woocommerceOrder-$order_id",
            'transactionType' => 1,
            'callbackUrl' => 'https://staging.housemag.top/wc-api/nix-pay-credit-webhook',
            'returnUrl' => 'https://staging.housemag.top/wc-api/nix-pay-credit-webhook',
            'customer' => array(
                "tag" => $order->get_formatted_billing_full_name(),
                "name" => $order->get_formatted_billing_full_name(),
                "identity" => $_POST['holder_document_number'],
                "identityType" => $_POST['holder_document_type'],
                "email" => $order->get_billing_email(),
                "birthdate" => "2002-08-27T00:00:00",
                "address" => array(
                    "country" => $order->get_billing_country(),
                    "zipCode" => $zip_code,
                    "number" => "01",
                    "street" => $order->get_billing_address_1(),
                    "complement" => $order->get_billing_address_2(),
                    "city" => $order->get_billing_city(),
                    "state" => $order->get_billing_state(),
                )
            ),
            'amount' => $amount,
            'capture' => true,
            'installments' => $_POST['installments_transaction'],
            'card' => array(
                'number' => $_POST['card_number'],
                'securityCode' => $_POST['card_security_code'],
                'expirationDate' => array(
                    'year' => '20' . $_POST['expiration_card_year'],
                    'month' => $_POST['expiration_card_month']
                ),
                'holder' => array(
                    'name' => $_POST['holder_name'],
                    'socialNumber' => $_POST['holder_document_number']
                )
            )

        );
        $signature_item = $order->get_item(intval($this->signature_item_id));
        if ($signature_item) {
            $payload += array(
                'recurrence' => array(
                    'merchantPlanId' => $this->recurrence_plan_id,
                    'startDate' => date('Y-m-d') . 'T' . date('H:i:s')
                )
            );
        }

        $encoded_payload = wp_json_encode($payload);

        error_log(print_r('payload:', true));
        error_log(print_r('' . $encoded_payload, true));


        $this->send_card_payment($encoded_payload);
        error_log(print_r('caiu no pay', true));


        if ($signature_item) {
            $user = $order->get_user();
            if ($user) {
                $user->remove_role('subscriber');
                $user->add_role('subscriber_premium');
            }

        }

        // Remove cart
        WC()->cart->empty_cart();

        // Return thankyou redirect
        return array(
            'result' => 'success',
            'redirect' => $this->get_return_url($order)
        );
    }

    private function send_card_payment($payload)
    {
        $headers = $this->get_headers();

        $response = wp_remote_post(
            $this->card_payments_url,
            array(
                'body' => $payload,
                'headers' => $headers
            )
        );
        error_log(print_r('' . wp_remote_retrieve_body($response), true));

        $status_code = wp_remote_retrieve_response_code($response);

        $decoded_body = json_decode(wp_remote_retrieve_body($response));

        if ($status_code > 299) {
            if (!empty($decoded_body->errors)
                and $decoded_body->errors[0] == 'Data.Card.Number: The Number field is not a valid credit card number.') {
                throw new Exception('O cartão informado é inválido.');

            }
            throw new Exception('Ocorreu um erro no processamento do seu pagamento.');
        }

        return $response;

    }

    private function get_headers(): array
    {
        $token = $this->perform_authenticate();

        $headers = array(
            'Content-Type' => 'application/json',
            'Authorization' => $token,
            'RequestId' => wp_generate_uuid4(),
        );
        return $headers;
    }

    private function perform_authenticate(): string
    {
        $payload = wp_json_encode(
            array(
                'user' => $this->cadun_user,
                'password' => $this->cadun_password
            )
        );

        $response = wp_remote_post(
            $this->cadun_url,
            array(
                'body' => $payload,
                'headers' => array(
                    'Content-Type' => 'application/json',
                )
            )
        );
        error_log(print_r('auth:', true));
        error_log(print_r('' . wp_remote_retrieve_body($response), true));

        $status_code = wp_remote_retrieve_response_code($response);

        if ($status_code > 299) {
            throw new Exception('Ocorreu um erro no processamento do seu pagamento.');
        }

        $decoded_body = json_decode(wp_remote_retrieve_body($response));

        return $decoded_body->access_token;

    }

    public function webhook(): void
    {
        error_log(print_r($_REQUEST, true));
        $postData = file_get_contents('php://input');
        error_log($postData);
        $requestData = json_decode($postData);
        error_log($requestData);

        $order_id = explode('-', $requestData->merchantOrderId)[1];
        error_log("Webhook receivied for order_id: $order_id");

        $order = wc_get_order($order_id);

        $matchPattern = [
            1 => 'wc-pending',
            2 => 'wc-completed',
            3 => 'wc-cancelled',
            5 => 'wc-refunded',
            6 => 'wc-refunded',
            7 => 'wc-failed',
            8 => 'wc-failed',
            9 => 'wc-failed',
        ];

        $newStatus = $matchPattern[$requestData->payment->paymentStatus];
        if ($newStatus == 'wc-completed') {
            $order->payment_complete();
        }
        $order->update_status($newStatus);

        error_log("Order $order_id status updated to $newStatus");


    }


    public function getPaymentFieldsParams()
    {
        global $woocommerce;

        return [
            'test_mode' => $this->test_mode,
            'total_cart_amount' => $woocommerce->cart->total
        ];

    }
}
