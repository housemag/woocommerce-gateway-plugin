import {registerPaymentMethod} from '@woocommerce/blocks-registry';
import {decodeEntities} from '@wordpress/html-entities';
import {getSetting} from '@woocommerce/settings';
import {useEffect} from '@wordpress/element';

import InputDocument from '../components/InputDocument';
import InputHelper from '../components/InputHelper';
import InputCardNumber from "../components/InputCardNumber";
import InputCardExpirationDate from "../components/InputCardExpirationDate";
import InputInstallments from "../components/InputInstallments";
import InputHolderName from "../components/InputHolderName";
import InputSecurityCode from "../components/InputSecurityCode";

const settings = getSetting('nixpay_data', {});

const defaultLabel = decodeEntities(settings.title) || 'Cartão de Crédito';

const Content = (props) => {
    const {
        test_mode,
        total_installments,
        total_cart_amount,
    } = settings.params;

    const {eventRegistration, emitResponse} = props;
    const {onPaymentSetup} = eventRegistration;


    useEffect(() => {
        const unsubscribe = onPaymentSetup(async () => {
            // Here we can do any processing we need, and then emit a response.
            // For example, we might validate a custom field, or perform an AJAX request, and then emit a response indicating it is valid or not.
            const holder_name = document.getElementById('card-holder-name').value;

            const holder_document_number = document.getElementById('holder-social-number-hidden').value;
            const holder_document_type = document.getElementById('holder-social-number-type').value;

            const card_number = document.getElementById('card-number-hidden-input').value;
            const expiration_card_month = document.getElementById('card-expiry-month-hidden').value;
            const expiration_card_year = document.getElementById('card-expiry-year-hidden').value;
            const card_security_code = document.getElementById('card-security-code').value;

            const installments_transaction = document.getElementById('card-selected-installment-hidden').value;

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
            }

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

                            <InputHolderName/>

                            <div className={'mp-checkout-custom-card-row mp-checkout-custom-dual-column-row'}>
                                <InputCardExpirationDate inputLabelMessage={'Vencimento'}
                                                         placeholder={'11/25'}/>

                                <InputSecurityCode/>
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
                                                   totalInstallments={total_installments}
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
