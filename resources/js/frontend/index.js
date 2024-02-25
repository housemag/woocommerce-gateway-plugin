import {sprintf, __} from '@wordpress/i18n';
import {registerPaymentMethod} from '@woocommerce/blocks-registry';
import {decodeEntities} from '@wordpress/html-entities';
import {getSetting} from '@woocommerce/settings';
import {useState, useRef, useEffect} from '@wordpress/element';

import InputDocument from './components/InputDocument';
import InputHelper from './components/InputHelper';
import InputLabel from './components/InputLabel';
import TestMode from './components/TestMode';

function formatCurrency(value, currency) {
    if (!Number.isInteger(value) || typeof currency !== 'object') {
        throw new Error('Invalid input');
    }
    const formattedValue = (value / Math.pow(10, currency.minorUnit)).toFixed(currency.minorUnit);
    const parts = formattedValue.split('.');
    const integerPart = parts[0]
    const decimalPart = parts[1];
    return `${integerPart}.${decimalPart}`;
}

function handleCartTotalChange(value, currency) {
    if (cardFormMounted) {
        cardForm.unmount();
    }
    initCardForm(formatCurrency(value, currency));
}

const settings = getSetting('nixpay_data', {});
console.log(settings);


const defaultLabel = __(
    'NixPay Payments',
    'woo-gutenberg-products-block'
);

const label = decodeEntities(settings.title) || defaultLabel;
/**
 * Content component
 */
const Content = (props) => {
    const {
        test_mode,
        card_installments_input_helper,
        amount,
        currency_ratio,
    } = settings.params;

    const ref = useRef(null);
    const [checkoutType, setCheckoutType] = useState('custom');

    const {eventRegistration, emitResponse, onSubmit} = props;
    const {onPaymentSetup, onCheckoutSuccess, onCheckoutFail} = eventRegistration;

    window.mpFormId = 'blocks_checkout_form';
    window.mpCheckoutForm = document.querySelector('.wc-block-components-form.wc-block-checkout__form');

    jQuery(window.mpCheckoutForm).prop('id', mpFormId);

    return (
        <div>
            <div className={'mp-checkout-custom-load'}>
                <div className={'spinner-card-form'}></div>
            </div>
            <div className={'mp-checkout-container'}>
                <div className={'mp-checkout-custom-container'}>
                    {test_mode ? (
                        <div className={'mp-checkout-pro-test-mode'}>
                            <TestMode
                                title={'test_mode_title'}
                                description={'test_mode_description'}
                                linkText={'test_mode_link_text'}
                                linkSrc={'test_mode_link_src'}
                            />
                        </div>
                    ) : null}

                    <div id={'mp-custom-checkout-form-container'}>

                        <div className={'mp-checkout-custom-card-form'}>
                            <p className={'mp-checkout-custom-card-form-title'}>Preencha os dados do seu cartão</p>

                            <div className={'mp-checkout-custom-card-row'}>
                                <InputLabel isOptinal={false} message={'Número do cartão'}
                                            forId={'mp-card-number'}/>
                                <div className={'mp-checkout-custom-card-input'}
                                     id={'form-checkout__cardNumber-container'}></div>
                                <InputHelper isVisible={false} message={'Dado obrigatório'}
                                             inputId={'mp-card-number-helper'}/>
                            </div>

                            <div className={'mp-checkout-custom-card-row'} id={'mp-card-holder-div'}>
                                <InputLabel message={'Nome do títular como aparece no cartão'} isOptinal={false}/>

                                <input
                                    className={'mp-checkout-custom-card-input mp-card-holder-name'}
                                    placeholder={'Ex.: María López'}
                                    id={'form-checkout__cardholderName'}
                                    name={'mp-card-holder-name'}
                                    data-checkout={'cardholderName'}
                                />

                                <InputHelper
                                    isVisible={false}
                                    message={'Dado obrigatório'}
                                    inputId={'mp-card-holder-name-helper'}
                                    dataMain={'mp-card-holder-name'}
                                />
                            </div>

                            <div className={'mp-checkout-custom-card-row mp-checkout-custom-dual-column-row'}>
                                <div className={'mp-checkout-custom-card-column'}>
                                    <InputLabel message={'Vencimento'} isOptinal={false}/>

                                    <div
                                        id={'form-checkout__expirationDate-container'}
                                        className={'mp-checkout-custom-card-input mp-checkout-custom-left-card-input'}
                                    />

                                    <InputHelper
                                        isVisible={false}
                                        message={'Dado obrigatório'}
                                        inputId={'mp-expiration-date-helper'}
                                    />
                                </div>

                                <div className={'mp-checkout-custom-card-column'}>
                                    <InputLabel message={'Código de segurança'} isOptinal={false}/>

                                    <div id={'form-checkout__securityCode-container'}
                                         className={'mp-checkout-custom-card-input'}/>
                                    <p id={'mp-security-code-info'} className={'mp-checkout-custom-info-text'}/>

                                    <InputHelper
                                        isVisible={false}
                                        message={'Dado obrigatório'}
                                        inputId={'mp-security-code-helper'}
                                    />
                                </div>
                            </div>

                            <div id={'mp-doc-div'} className={'mp-checkout-custom-input-document'}
                                 style={{display: 'none'}}>
                                <InputDocument
                                    labelMessage={'Documento do titular'}
                                    helperMessage={'Número de documento inválido'}
                                    inputName={'identificationNumber'}
                                    hiddenId={'form-checkout__identificationNumber'}
                                    inputDataCheckout={'docNumber'}
                                    selectId={'form-checkout__identificationType'}
                                    selectName={'identificationType'}
                                    selectDataCheckout={'docType'}
                                    flagError={'docNumberError'}
                                />
                            </div>
                        </div>

                        <div id={'mp-checkout-custom-installments'}
                             className={'mp-checkout-custom-installments-display-none'}>
                            <p className={'mp-checkout-custom-card-form-title'}>{'Escolha o número de parcelas'}</p>

                            <div id={'mp-checkout-custom-issuers-container'}
                                 className={'mp-checkout-custom-issuers-container'}>
                                <div className={'mp-checkout-custom-card-row'}>
                                    <InputLabel isOptinal={false} message={'Banco emissor'}
                                                forId={'mp-issuer'}/>
                                </div>

                                <div className={'mp-input-select-input'}>
                                    <select name={'issuer'} id={'form-checkout__issuer'}
                                            className={'mp-input-select-select'}></select>
                                </div>
                            </div>

                            <div
                                id={'mp-checkout-custom-installments-container'}
                                className={'mp-checkout-custom-installments-container'}
                            />

                            <InputHelper
                                isVisible={false}
                                message={'Escolha o número de parcelas'}
                                inputId={'mp-installments-helper'}
                            />

                            <select
                                style={{display: 'none'}}
                                data-checkout={'installments'}
                                name={'installments'}
                                id={'form-checkout__installments'}
                                className={'mp-input-select-select'}
                            />

                            <div id={'mp-checkout-custom-box-input-tax-cft'}>
                                <div id={'mp-checkout-custom-box-input-tax-tea'}>
                                    <div id={'mp-checkout-custom-tax-tea-text'}></div>
                                </div>
                                <div id={'mp-checkout-custom-tax-cft-text'}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div ref={ref} id={'mercadopago-utilities'} style={{display: 'none'}}>
                <input type={'hidden'} id={'cardTokenId'} name={'mercadopago_custom[token]'}/>
                <input type={'hidden'} id={'mpCardSessionId'} name={'mercadopago_custom[session_id]'}/>
                <input type={'hidden'} id={'cardExpirationYear'} data-checkout={'cardExpirationYear'}/>
                <input type={'hidden'} id={'cardExpirationMonth'} data-checkout={'cardExpirationMonth'}/>
                <input type={'hidden'} id={'cardInstallments'} name={'mercadopago_custom[installments]'}/>
                <input type={'hidden'} id={'paymentMethodId'} name={'mercadopago_custom[payment_method_id]'}/>
                <input type={'hidden'} id={'mp-amount'} defaultValue={amount} name={'mercadopago_custom[amount]'}/>

                <input
                    type={'hidden'}
                    id={'currency_ratio'}
                    defaultValue={currency_ratio}
                    name={'mercadopago_custom[currency_ratio]'}
                />

                <input
                    type={'hidden'}
                    id={'mp_checkout_type'}
                    name={'mercadopago_custom[checkout_type]'}
                    value={checkoutType}
                />
            </div>
        </div>
    );


    return decodeEntities(settings.description || '');
};
/**
 * Label component
 *
 * @param {*} props Props from payment API.
 */
const Label = (props) => {
    const {PaymentMethodLabel} = props.components;
    return <PaymentMethodLabel text={label}/>;
};

/**
 * NixPay payment method config object.
 */
const NixPay = {
    name: "nixpay",
    label: <Label/>,
    content: <Content/>,
    edit: <Content/>,
    canMakePayment: () => true,
    ariaLabel: label,
    supports: {
        features: settings.supports,
    },
};

registerPaymentMethod(NixPay);
