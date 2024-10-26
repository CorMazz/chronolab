import { Button, Tooltip } from '@mui/material';
import {
    TableChart as CsvIcon,
    VideoFile as VideoIcon,
} from '@mui/icons-material';

import useGlobalState from "../../hooks/useGlobalState";
import { useFileOperations } from '../../hooks/useFileOperations';

export function FileSelectionButtons() {
    const { setCsvFilePath, setVideoFilePath } = useGlobalState({
        csvFile: true,
        videoFile: true,
        setOnly: true
    });
    const { selectCsvFile, selectVideoFile } = useFileOperations();

    return (
        <>
            <Tooltip title="Select CSV File">
                <Button
                    color="inherit"
                    onClick={() => selectCsvFile(setCsvFilePath)}
                    startIcon={<CsvIcon />}
                    sx={{ borderRadius: 1 }}
                >
                    CSV File
                </Button>
            </Tooltip>

            <Tooltip title="Select Video File">
                <Button
                    color="inherit"
                    onClick={() => selectVideoFile(setVideoFilePath)}
                    startIcon={<VideoIcon />}
                    sx={{ borderRadius: 1 }}
                >
                    Video File
                </Button>
            </Tooltip>
        </>
    );
}
