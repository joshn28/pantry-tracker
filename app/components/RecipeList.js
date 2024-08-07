import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  List,
  ListItem,
} from "@mui/material";
import { TransitionGroup } from 'react-transition-group';

const RecipeList = ({ recipes }) => {
  return (
    <Box my={10}>
      <Typography variant="h3" textAlign="center">
        Recipes
      </Typography>
      <Typography variant="subtitle1" textAlign="center" mb={10}>
        Created straight from your pantry.
      </Typography>
      <Stack direction={{ xs: "column", md: "row" }} spacing={5}>
        {recipes.map(({ name, ingredients, instructions }) => {
          return (
            <Card key={name}>
              <CardContent>
                <Typography variant="h5" component="div">
                  {name}
                </Typography>
                <Typography sx={{ mb: 1.5 }} color="text.secondary">
                  {ingredients}
                </Typography>
                <List>
                  {instructions.split(/[0-9]\.\s/).slice(1).map((step, i) => {
                    return (
                      <ListItem key={i}>{`${i + 1}. ${step.trim()}`}</ListItem>
                    );
                  })}
                </List>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
};

export default RecipeList;
