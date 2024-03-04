import {registerPaymentMethod} from '@woocommerce/blocks-registry';
import {decodeEntities} from '@wordpress/html-entities';
import {getSetting} from '@woocommerce/settings';
import {useState, useRef, useEffect} from '@wordpress/element';

import InputDocument from '../components/InputDocument';
import InputHelper from '../components/InputHelper';
import InputLabel from '../components/InputLabel';
import InputCardNumber from "../components/InputCardNumber";
import InputCardExpirationDate from "../components/InputCardExpirationDate";
import InputInstallments from "../components/InputInstallments";

const settings = getSetting('nixpay_data', {});

const defaultLabel = decodeEntities(settings.title) || 'Cartão de Crédito';
/**
 * Content component
 */
const Content = (props) => {
    const {
        test_mode,
        total_cart_amount,
    } = settings.params;

    const {eventRegistration, emitResponse} = props;
    const {onPaymentSetup} = eventRegistration;

    function setInputDisplayStyle(inputElement, displayValue) {
        if (inputElement && inputElement.style) {
            inputElement.style.display = displayValue;
        }
    }


    useEffect(() => {
        const unsubscribe = onPaymentSetup(async () => {
            // Here we can do any processing we need, and then emit a response.
            // For example, we might validate a custom field, or perform an AJAX request, and then emit a response indicating it is valid or not.

            const holder_name_element = document.getElementById('card-holder-name');

            const holder_document_number_element = document.getElementById('holder-social-number-hidden');
            const holder_document_type_element = document.getElementById('holder-social-number-type');

            const card_number_element = document.getElementById('card-number-hidden-input');
            const expiration_card_month_element = document.getElementById('card-expiry-month-hidden');
            const expiration_card_year_element = document.getElementById('card-expiry-year-hidden');
            const card_security_code_element = document.getElementById('card-security-code');

            const installments_transaction_element = document.getElementById('card-selected-installment-hidden');

            const all_fields = [
                holder_name_element,
                holder_document_number_element,
                card_number_element,
                expiration_card_month_element,
                expiration_card_year_element,
                card_security_code_element,
                installments_transaction_element];

            let has_error = false;

            for (const field of all_fields) {
                if (field.value === 'undefined' || field.value === '' || field.value === 0) {
                    setInputDisplayStyle(field.id + '-helper', 'flex');
                    has_error = true;
                }
            }

            if (has_error) {
                return {
                    type: emitResponse.responseTypes.ERROR
                }
            }

            const holder_name = holder_name_element.value;
            const holder_document_number = holder_document_number_element.value;
            const holder_document_type = holder_document_type_element.value;

            const card_number = card_number_element.value;
            const expiration_card_month = expiration_card_month_element.value;
            const expiration_card_year = expiration_card_year_element.value;
            const card_security_code = card_security_code_element.value;

            const installments_transaction = installments_transaction_element.value;


            return {
                type: emitResponse.responseTypes.SUCCESS,
                meta: {
                    paymentMethodData: {
                        holder_name,
                        holder_document_number,
                        holder_document_type,
                        card_number,
                        expiration_card_month,
                        expiration_card_year,
                        card_security_code,
                        installments_transaction
                    },
                },
            };

        });
        // Unsubscribes when this component is unmounted.
        return () => {
            unsubscribe();
        };
    }, [
        emitResponse.responseTypes.ERROR,
        emitResponse.responseTypes.SUCCESS,
        onPaymentSetup,
    ]);

    return (
        <form name={'form-checkout'}>
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
                                    id={'card-holder-name'}
                                    name={'mp-card-holder-name'}
                                    data-checkout={'cardholderName'}
                                />

                                <InputHelper
                                    isVisible={false}
                                    message={'Dado obrigatório'}
                                    inputId={'card-holder-name-helper'}
                                />
                            </div>

                            <div className={'mp-checkout-custom-card-row mp-checkout-custom-dual-column-row'}>
                                <InputCardExpirationDate inputLabelMessage={'Vencimento'}
                                                         inputHelperMessage={'Dado obrigatório'}
                                                         placeholder={'11/25'}/>

                                <div className={'mp-checkout-custom-card-column'}>
                                    <InputLabel message={'Código de segurança'} isOptional={false}/>

                                    <input
                                        id={'card-security-code'}
                                        className={'mp-checkout-custom-card-input'}
                                        placeholder={'123'}
                                        style={{
                                            fontSize: '16px',
                                            height: '40px',
                                            paddingLeft: '10px'
                                        }}
                                        maxLength={3}
                                    />

                                    <p id={'mp-security-code-info'} className={'mp-checkout-custom-info-text'}/>

                                    <InputHelper
                                        isVisible={false}
                                        message={'Dado obrigatório'}
                                        inputId={'card-security-code-helper'}
                                    />
                                </div>
                            </div>

                            <div id={'mp-doc-div'} className={'mp-checkout-custom-input-document'}>
                                <InputDocument
                                    labelMessage={'Documento do titular'}
                                    helperMessage={'Número de documento inválido'}
                                    inputName={'identificationNumber'}
                                    hiddenId={'holder-social-number-hidden'}
                                    inputDataCheckout={'docNumber'}
                                    selectId={'holder-social-number-type'}
                                    selectName={'identificationType'}
                                    selectDataCheckout={'docType'}
                                    flagError={'docNumberError'}
                                    documents={["CPF", "CNPJ"]}
                                    validate={true}
                                />
                            </div>

                            <div id={'mp-checkout-custom-installments'}
                                 className={'mp-checkout-custom-installments-display-flex'}
                                 style={{display: 'block'}}>
                                <p className={'mp-checkout-custom-card-form-title'}>Escolha o número de parcelas</p>

                                <InputInstallments totalAmount={total_cart_amount}
                                                   totalInstallments={12}
                                                   inputHelperMessage={'Escolha o número de parcelas'}
                                                   inputHelperId={'mp-installments-helper'}
                                                   inputHelperIsVisible={false}/>

                                <InputHelper
                                    isVisible={false}
                                    message={'Escolha o número de parcelas'}
                                    inputId={'card-selected-installment-hidden-helper'}
                                />
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </form>
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
    return <PaymentMethodLabel text={defaultLabel}/>;
};

/**
 * NixPay payment method config object.
 */
const nixPayPaymentMethod = {
    name: "nixpay",
    label: <Label/>,
    content: <Content/>,
    edit: <Content/>,
    canMakePayment: () => true,
    ariaLabel: defaultLabel,
    supports: {
        features: settings?.supports ?? [],
    },
};

registerPaymentMethod(nixPayPaymentMethod);
