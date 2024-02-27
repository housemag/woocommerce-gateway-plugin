const InputRadio = ({name, value, radioId}) => {

    return (
        <div className={'mp-input-radio-container'}>
            <input
                className={'mp-input-radio-radio'}
                type={'radio'}
                id={radioId}
                name={name}
                value={value}
                data-cy={'input-radio'}
            />
            <label className={'mp-input-radio-label'} htmlFor={radioId}></label>
        </div>
    )
};

export default InputRadio;