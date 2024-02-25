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
	 * Whether the gateway is visible for non-admin users.
	 * @var boolean
	 *
	 */
	protected $hide_for_non_admin_users;

	/**
	 * Unique id for the gateway.
	 * @var string
	 *
	 */
	public $id = 'nixpay';

	/**
	 * Constructor for the gateway.
	 */
	public function __construct()
	{
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
		$this->description = $this->get_option('description');
		$this->instructions = $this->get_option('instructions', $this->description);
		$this->hide_for_non_admin_users = $this->get_option('hide_for_non_admin_users');
		$this->signatue_item_id = $this->get_option('signatue_item_id');
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
			'hide_for_non_admin_users' => array(
				'type' => 'checkbox',
				'label' => __('Hide at checkout for non-admin users', 'woocommerce-gateway-nixpay'),
				'default' => 'no',
			),
			'title' => array(
				'title' => __('Título', 'woocommerce-gateway-nixpay'),
				'type' => 'text',
				'description' => __('Isto controla o título que o usuário vê durante o checkout.', 'woocommerce-gateway-nixpay'),
				'default' => _x('NixPay Payment', 'NixPay payment method', 'woocommerce-gateway-nixpay'),
				'desc_tip' => true,
			),
			'description' => array(
				'title' => __('Descrição', 'woocommerce-gateway-nixpay'),
				'type' => 'textarea',
				'description' => __('Descrição do método de pagamento que o cliente verá no seu checkout.', 'woocommerce-gateway-nixpay'),
				'default' => __('Não é necessário dinheiro.', 'woocommerce-gateway-nixpay'),
				'desc_tip' => true,
			),
			'signatue_item_id' => array(
				'title' => __('ID do item de assinatura', 'woocommerce-gateway-nixpay'),
				'type' => 'text',
				'description' => __('ID do produto de assinatura do WooCommerce', 'woocommerce-gateway-nixpay'),
			),
			'recurrence_plan_id' => array(
				'title' => __('ID do plano de recorrência NixPay', 'woocommerce-gateway-nixpay'),
				'type' => 'text',
			),
			'production_api_user' => array(
				'title' => __('Usuário API de produção', 'woocommerce-gateway-nixpay'),
				'type' => 'text',
			),
			'production_api_password' => array(
				'title' => __('Senha do usuário API de produção', 'woocommerce-gateway-nixpay'),
				'type' => 'password',
			),
			'test_mode' => array(
				'title' => __('Modo de teste', 'woocommerce-gateway-nixpay'),
				'type' => 'checkbox',
				'description' => __('Habilita/Desabilita o modo de teste.', 'woocommerce-gateway-nixpay'),
			),
			'test_api_user' => array(
				'title' => __('Usuário API de Sandbox', 'woocommerce-gateway-nixpay'),
				'type' => 'text',
			),
			'test_api_password' => array(
				'title' => __('Senha do usuário API de Sandbox', 'woocommerce-gateway-nixpay'),
				'type' => 'password',
			)
		);
	}

	/**
	 * Process the payment and return the result.
	 *
	 * @param  int  $order_id
	 * @return array
	 */
	public function process_payment($order_id)
	{
		$order = wc_get_order($order_id);

		$amount = number_format($order->get_total() * 100.0, 0, '.', '');

		$zip_code = str_replace('-', '', $order->get_billing_postcode());

		$payload = wp_json_encode(
			array(
				'merchantOrderId' => 'teste-gabriel-wordpress-1',
				'transactionType' => 1,
				'returnUrl' => 'https://teste.com',
				'customer' => array(
					"tag" => $order->get_formatted_billing_full_name(),
					"name" => $order->get_formatted_billing_full_name(),
					"identity" => "50644825820",
					"identityType" => "CPF",
					"email" => $order->get_billing_email(),
					"birthdate" => "2002-08-27T00:00:00",
					"address" => array(
						"country" => $order->get_billing_country(),
						"zipCode" => $zip_code,
						"number" => "85",
						"street" => $order->get_billing_address_1(),
						"complement" => $order->get_billing_address_2(),
						"city" => $order->get_billing_city(),
						"state" => $order->get_billing_state(),
					)
				),
				'amount' => $amount,
				'installments' => 1,
				'card' => array(
					'number' => '5487542468386489',
					'securityCode' => '865',
					'expirationDate' => array(
						'year' => '2025',
						'month' => '07'
					),
					'holder' => array(
						'name' => 'Gabriel Cavalheiro',
						'socialNumber' => '50644825820'
					)
				)
			)
		);
		error_log(print_r('payload:', true));
		error_log(print_r('' . $payload, true));


		$this->send_card_payment($payload);
		error_log(print_r('caiu no pay', true));


		$signature_item = $order->get_item(intval($this->signatue_item_id));
		if ($signature_item) {
			$user = $order->get_user();
			$user->remove_role('subscriber');
			$user->add_role('subscriber_premium');
		}


		$order->payment_complete();

		// Remove cart
		WC()->cart->empty_cart();

		// Return thankyou redirect
		return array(
			'result' => 'success',
			'redirect' => $this->get_return_url($order)
		);
	}

	/**
	 * Process subscription payment.
	 *
	 * @param  float     $amount
	 * @param  WC_Order  $order
	 * @return void
	 */
	public function process_subscription_payment($amount, $order)
	{
		$payload = wp_json_encode(
			array(
				'merchantOrderId' => 'teste-gabriel-wordpress',
				'transactionType' => 1,
				'returnUrl' => 'https://teste.com',
				'customer' => array(
					"tag" => "teste-gabriel-wordpress",
					"name" => "Teste do Gabriel no Wordpress",
					"identity" => "50644825820",
					"identityType" => "CPF",
					"email" => "ga3-cavalheiro@hotmail.com",
					"birthdate" => "2002-08-27T00:00:00",
					"address" => array(
						"country" => "BR",
						"zipCode" => "94859310",
						"number" => "85",
						"street" => "Rua das Graunas",
						"complement" => "Casa",
						"city" => "Alvorada",
						"state" => "RS",
						"neighborhood" => "Jardim Algarve"
					)
				),
				'amount' => 5000,
				'installments' => 1,
				'card' => array(
					'number' => '5487542468386489',
					'securityCode' => '865',
					'expirationDate' => array(
						'year' => '2025',
						'month' => '07'
					),
					'holder' => array(
						'name' => 'Gabriel Cavalheiro',
						'socialNumber' => '50644825820'
					)
				)
			)
		);

		$this->send_card_payment($payload);
		error_log(print_r('caiu no sub', true));

		$signature_item = $order->get_item(intval($this->signatue_item_id));
		if ($signature_item) {
			$user = $order->get_user();
			$user->remove_role('subscriber');
			$user->add_role('subscriber_premium');
		}

		$order->payment_complete();
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


		if (is_wp_error($response)) {
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


		if (is_wp_error($response)) {
			throw new Exception('Ocorreu um erro no processamento do seu pagamento.');
		}

		$decoded_body = json_decode(wp_remote_retrieve_body($response));

		return $decoded_body->access_token;

	}

    public function getPaymentFieldsParams()
    {
        return [
            'test_mode' => $this->test_mode,
        ];

    }
}
