import InputLabel from "./InputLabel";
import InputHelper from "./InputHelper";

const InputCardExpirationDate = ({inputLabelMessage, inputHelperMessage, placeholder}) => {

    const setExpirationDateMark = (event) => {
        let inputChar = String.fromCharCode(event.keyCode);
        let code = event.keyCode;
        let allowedKeys = [8];
        if (allowedKeys.indexOf(code) !== -1) {
            return;
        }

        const formattedValue = event.target.value.replace(
            /^([1-9]\/|[2-9])$/g, '0$1/'
        ).replace(
            /^(0[1-9]|1[0-2])$/g, '$1/'
        ).replace(
            /^([0-1])([3-9])$/g, '0$1/$2'
        ).replace(
            /^(0?[1-9]|1[0-2])([0-9]{2})$/g, '$1/$2'
        ).replace(
            /^([0]+)\/|[0]+$/g, '0'
        ).replace(
            /[^\d\/]|^[\/]*$/g, ''
        ).replace(
            /\/\//g, '/'
        );
        event.target.value = formattedValue;
    };

    const expirationDateInputOnBlurHandler = (event) => {
        if (event.target.value !== '') {
            let regExp = /(1[0-2]|0[1-9]|\d)\/(20\d{2}|19\d{2}|0(?!0)\d|[1-9]\d)/;
            let matches = regExp.exec(event.target.value);

            const monthHidden = document.getElementsByName('card-expiry-month-hidden')[0];
            if (monthHidden) {
                monthHidden.value = matches[1];
            }

            const yearHidden = document.getElementsByName('card-expiry-year-hidden')[0];
            if (yearHidden) {
                yearHidden.value = matches[2];
            }
        }
    };

    return (
        <div className={'mp-checkout-custom-card-column'}>
            <InputLabel message={inputLabelMessage} isOptional={false}/>

            <input
                id={'form-checkout__expirationDate-container'}
                className={'mp-checkout-custom-card-input mp-checkout-custom-left-card-input'}
                maxLength={5}
                placeholder={placeholder}
                style={{
                    fontSize: '16px',
                    height: '40px',
                    paddingLeft: '10px'
                }}
                type={'text'}
                onKeyUp={setExpirationDateMark}
                onBlur={expirationDateInputOnBlurHandler}
            />
            <input type="hidden" name="card-expiry-month-hidden" id={'card-expiry-month-hidden'}/>
            <input type="hidden" name="card-expiry-year-hidden" id={'card-expiry-year-hidden'}/>

            <InputHelper
                isVisible={false}
                message={inputHelperMessage}
                inputId={'mp-expiration-date-helper'}
            />
        </div>
    )

};

export default InputCardExpirationDate;