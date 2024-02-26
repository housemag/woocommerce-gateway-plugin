const InputHelper = ({isVisible, message, inputId}) => {
    let display_type = isVisible ? 'flex' : 'none';

    return (
        <div className={'mp-helper'} id={inputId} data-cy={'helper-container'} style={{display: display_type}}>
            <div className={'mp-helper-icon'}>!</div>
            <div className={'mp-helper-message'} data-cy={'helper-message'}>{message}</div>
        </div>
    );
};

export default InputHelper;
