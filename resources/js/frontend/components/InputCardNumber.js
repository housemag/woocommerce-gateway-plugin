import InputLabel from "./InputLabel";
import InputHelper from "./InputHelper";
import {useState} from '@wordpress/element';


const InputCardNumber = ({hiddenId, inputLabelMessage, inputHelperMessage}) => {
    const [cardNumberValue, setCardNumberValue] = useState('');

    const setInputCardNumberMask = (event) => {
        console.log(event)
        const hiddenInput = document.getElementById(hiddenId);

        const cardNumber = event.target.value
            .replace(/\s+/g, "")
            .replace(/[^0-9]/gi, "")
            .substr(0, 16);
        const parts = [];

        for (let i = 0; i < cardNumber.length; i += 4) {
            parts.push(cardNumber.substr(i, 4));
        }

        const formattedCardNumber = parts.length > 1 ? parts.join(" ") : event.target.value;
        console.log(formattedCardNumber)

        event.target.value = formattedCardNumber;

        if (hiddenInput){
            hiddenInput.value = formattedCardNumber;
        }
    };


    return (
        <div className={'mp-checkout-custom-card-row'}>
            <InputLabel isOptional={false} message={inputLabelMessage}/>
            <input
                className={'mp-checkout-custom-card-input'}
                id={'form-checkout__cardNumber-container'}
                placeholder={'0000 0000 0000 0000'}
                style={{
                    fontSize: '16px',
                    height: '40px',
                    padding: '14px',

                }}
                onInput={setInputCardNumberMask}
            />

            <InputHelper isVisible={false} message={inputHelperMessage}
                         inputId={'mp-card-number-helper'}/>
        </div>
    )
};

export default InputCardNumber;