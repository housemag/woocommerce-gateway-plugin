import {sprintf, __} from '@wordpress/i18n';
import {registerPaymentMethod} from '@woocommerce/blocks-registry';
import {decodeEntities} from '@wordpress/html-entities';
import {getSetting} from '@woocommerce/settings';
import {useState, useRef, useEffect} from '@wordpress/element';

import InputDocument from './components/InputDocument';
import InputHelper from './components/InputHelper';
import InputLabel from './components/InputLabel';
import TestMode from './components/TestMode';
import InputCardNumber from "./components/InputCardNumber";

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

    // useEffect(() => {
    //     if (cardFormMounted) {
    //         cardForm.unmount();
    //     }
    //     initCardForm();
    //
    //     const unsubscribe = onPaymentSetup(async () => {
    //         const cardholderName = document.querySelector('#form-checkout__cardholderName');
    //         const cardholderNameErrorMessage = document.querySelector('#mp-card-holder-name-helper');
    //
    //         if(cardholderName.value == ''){
    //             setInputDisplayStyle(cardholderNameErrorMessage, 'flex');
    //         }
    //
    //         function setInputDisplayStyle(inputElement, displayValue) {
    //             if (inputElement && inputElement.style) {
    //                 inputElement.style.display = displayValue;
    //             }
    //         }
    //
    //         if (document.querySelector('#mp_checkout_type').value !== 'wallet_button') {
    //             try {
    //                 if (CheckoutPage.validateInputsCreateToken()) {
    //                     const cardToken = await cardForm.createCardToken();
    //                     document.querySelector('#cardTokenId').value = cardToken.token;
    //                 } else {
    //                     return { type: emitResponse.responseTypes.ERROR };
    //                 }
    //             } catch (error) {
    //                 console.warn('Token creation error: ', error);
    //             }
    //         }
    //
    //         const checkoutInputs = ref.current;
    //         const paymentMethodData = {};
    //
    //         checkoutInputs.childNodes.forEach((input) => {
    //             if (input.tagName === 'INPUT' && input.name) {
    //                 paymentMethodData[input.name] = input.value;
    //             }
    //         });
    //
    //         // asserting that next submit will be "custom", unless the submitWalletButton function is fired
    //         setCheckoutType('custom');
    //
    //         return {
    //             type: emitResponse.responseTypes.SUCCESS,
    //             meta: {
    //                 paymentMethodData,
    //             },
    //         };
    //     });
    //
    //     return () => unsubscribe();
    // }, [onPaymentSetup, emitResponse.responseTypes.ERROR, emitResponse.responseTypes.SUCCESS]);

    return (
        <div>
            <div className={'mp-checkout-custom-load'}>
                <div className={'spinner-card-form'}></div>
            </div>
            <div className={'mp-checkout-container'}>
                <div className={'mp-checkout-custom-container'}>
                    <div id={'mp-custom-checkout-form-container'}>

                        <div className={'mp-checkout-custom-card-form'}>
                            <p className={'mp-checkout-custom-card-form-title'}>Preencha os dados do seu cartão</p>

                            <InputCardNumber hiddenId={'card-number-hidden-input'}
                                             inputLabelMessage={'Número do cartão'}
                                             inputHelperMessage={'Dado obrigatório'}/>

                            <div className={'mp-checkout-custom-card-row'} id={'mp-card-holder-div'}>
                                <InputLabel message={'Nome do títular como aparece no cartão'} isOptional={false}/>

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
                                />
                            </div>

                            <div className={'mp-checkout-custom-card-row mp-checkout-custom-dual-column-row'}>
                                <div className={'mp-checkout-custom-card-column'}>
                                    <InputLabel message={'Vencimento'} isOptional={false}/>

                                    <input
                                        id={'form-checkout__expirationDate-container'}
                                        className={'mp-checkout-custom-card-input mp-checkout-custom-left-card-input'}
                                        placeholder={'11/25'}
                                        style={{
                                            fontSize: '16px',
                                            height: '40px',
                                            padding: '14px',
                                        }}
                                    />

                                    <InputHelper
                                        isVisible={false}
                                        message={'Dado obrigatório'}
                                        inputId={'mp-expiration-date-helper'}
                                    />
                                </div>

                                <div className={'mp-checkout-custom-card-column'}>
                                    <InputLabel message={'Código de segurança'} isOptional={false}/>

                                    <input
                                        id={'form-checkout__securityCode-container'}
                                        className={'mp-checkout-custom-card-input'}
                                        placeholder={'123'}
                                        style={{
                                            fontSize: '16px',
                                            height: '40px',
                                            padding: '14px',
                                        }}
                                        maxLength={3}
                                    />

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
                                    documents={["CPF", "CNPJ", "CI", "Outro"]}
                                    validate={true}
                                />
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
                <input type={'hidden'} id={'mp-amount'} defaultValue={0.00} name={'mercadopago_custom[amount]'}/>

                <input
                    type={'hidden'}
                    id={'currency_ratio'}
                    defaultValue={0.00}
                    name={'mercadopago_custom[currency_ratio]'}
                />

                <input
                    type={'hidden'}
                    id={'mp_checkout_type'}
                    name={'mercadopago_custom[checkout_type]'}
                    value={'custom'}
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
