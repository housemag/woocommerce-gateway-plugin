
import { sprintf, __ } from '@wordpress/i18n';
import { registerPaymentMethod } from '@woocommerce/blocks-registry';
import { decodeEntities } from '@wordpress/html-entities';
import { getSetting } from '@woocommerce/settings';

const settings = getSetting('nixpay_data', {});

const defaultLabel = __(
	'NixPay Payments',
	'woo-gutenberg-products-block'
);

const label = decodeEntities(settings.title) || defaultLabel;
/**
 * Content component
 */
const Content = () => {
	return decodeEntities(settings.description || '');
};
/**
 * Label component
 *
 * @param {*} props Props from payment API.
 */
const Label = (props) => {
	const { PaymentMethodLabel } = props.components;
	return <PaymentMethodLabel text={label} />;
};

/**
 * NixPay payment method config object.
 */
const NixPay = {
	name: "nixpay",
	label: <Label />,
	content: <Content />,
	edit: <Content />,
	canMakePayment: () => true,
	ariaLabel: label,
	supports: {
		features: settings.supports,
	},
};

registerPaymentMethod(NixPay);
