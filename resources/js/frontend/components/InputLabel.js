const InputLabel = ({isOptional, message}) => {

    if (typeof isOptional === 'string') {
        isOptional = isOptional !== 'false';
    }

    return (
        <div className={'mp-input-label'} data-cy={'input-label'}>
            {message}
            {!isOptional ? <b style={{color: 'red'}}>*</b> : null}
        </div>
    );
}

export default InputLabel;
