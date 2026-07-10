import { useState, useCallback } from 'react';

function useToggle(defaultValue) {
    const [value, setValue] = useState(defaultValue || false);

    const toggle = useCallback(() => {
        setValue(prev => !prev);
    }, []);

    return { value, setValue, toggle };
}

export default useToggle;
