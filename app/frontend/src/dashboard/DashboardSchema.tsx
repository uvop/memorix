import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useSchemaDetailsQuery } from "./DashboardSchema.generated";
import { Check, Clear } from "@mui/icons-material";

export enum ValueTypes {
  simple,
  object,
  array,
}

export const DashboardSchema = () => {
  const { loading, data } = useSchemaDetailsQuery();

  if (!data || loading) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="models-content"
          id="models-header"
        >
          <Typography>Models</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {/* {data.schema.models.map((m) => (
            <Accordion key={m.id}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`${m.id}-content`}
                id={`${m.id}-header`}
              >
                <Typography>{m.name}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="h6">Properties</Typography>
                {m.object.properties.map((mp) => (
                  <Box key={mp.name}>
                    <Typography>name: {mp.name}</Typography>
                    <Typography>
                      is optional: {mp.isOptional ? <Check /> : <Clear />}
                    </Typography>
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>
          ))} */}
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="cache-content"
          id="cache-header"
        >
          <Typography>Cache</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {data.schema.cache.map((c) => (
            <Accordion key={c.id}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`${c.id}-content`}
                id={`${c.id}-header`}
              >
                <Typography>{c.name}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {c.key && c.key.type === ValueTypes.simple && (
                  <Typography variant="h6">key: {c.key.name}</Typography>
                )}
                {c.payload.type === ValueTypes.object && (
                  <Typography variant="h6">payload: Object</Typography>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};
