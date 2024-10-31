import React, { useState } from 'react';
import { Button, Box, IconButton } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';

interface OptionalButtonProps {
    onClick: () => void;
    toggleable: boolean;
    hideIcon?: React.ReactNode;  
    showIcon?: React.ReactNode; 
    children?: React.ReactNode; 
}

/*
* An optional button component that allows you to hide a button if you don't want to interact with it. 
* Toggleable means you can unhide the button once you hide it.
*/
function OptionalButton({
    onClick,
    toggleable,
    hideIcon = <RemoveCircleIcon fontSize='small'/>,  // Default hide icon
    showIcon = <AddCircleIcon />,  // Default show icon
    children,
}: OptionalButtonProps ) {

    const [showButton, setShowButton] = useState(true);

    return (
        <Box display="flex" alignItems="center" mt={2}>
            {/* Conditional rendering of the button */}
            {showButton && (
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={onClick}
                    >
                        {children}
                    </Button>

                    {/* IconButton overlaps the top-right corner */}
                    <IconButton
                        color="error"
                        onClick={() => setShowButton(false)}
                        sx={{
                            position: 'absolute',
                            top: '-8px',     
                            right: '-8px',    
                            padding: '4px',   
                        }}
                    >
                        {hideIcon}
                    </IconButton>
                </Box>
            )}

            {/* Optional: Add a way to show the button again */}
            {!showButton && toggleable && (
                <IconButton
                    color="secondary"
                    onClick={() => setShowButton(true)}
                >
                    {showIcon}
                </IconButton>
            )}
        </Box>
    );
};

export default OptionalButton;
