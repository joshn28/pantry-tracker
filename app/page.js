"use client";
import { useState, useEffect, useRef } from "react";
import { firestore } from "@/firebase";
import {
  Box,
  Modal,
  Stack,
  Typography,
  TextField,
  Button,
  Container,
  Snackbar
} from "@mui/material";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { DataGrid, GridToolbar, GridActionsCellItem } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { Camera } from "react-camera-pro";
import axios from "axios";

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const camera = useRef(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [recipesMade, setRecipesMade] = useState(false);

  const updateInventory = async () => {
    const docs = await getDocs(collection(firestore, "inventory"));
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({
        id: doc.id,
        name: doc.id.charAt(0).toUpperCase() + doc.id.slice(1),
        item: doc.id,
        ...doc.data(),
      });
    });
    setInventory(inventoryList);
  };

  const addItem = async (item, numOfItems = 1) => {
    const docRef = doc(firestore, "inventory", item.toLowerCase());
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + numOfItems });
    } else {
      await setDoc(docRef, { quantity: numOfItems });
    }

    await updateInventory();
  };

  const removeItem = async (item) => {
    const docRef = doc(firestore, "inventory", item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1 });
      }
    }

    await updateInventory();
  };

  const getRecipes = async () => {
    await axios
      .post("/api/recipe", {
        inventory: inventory,
      })
      .then((res) => {
        setRecipesMade(true);
        const recipe = JSON.parse(res.data.recipes.content);
        setRecipes([...recipes, recipe]);
        console.log(recipe)
      })
      .catch((err) => {
        console.error("Unable to generate recipes at this time!", err);
      });
  };

  const columns = [
    {
      field: "name",
      headerName: "Item Name",
      flex: 1,
      hideable: false,
      editable: true,
    },
    {
      field: "quantity",
      headerName: "Quantity",
      type: "number",
      flex: 1,
      hideable: false,
      editable: true,
    },
    {
      field: "item",
      headerName: "Actions",
      flex: 1,
      sortable: false,
      hideable: false,
      filterable: false,
      renderCell: (param) => (
        <>
          <GridActionsCellItem
            icon={<AddIcon />}
            onClick={() => addItem(param.value)}
          />
          <GridActionsCellItem
            icon={<RemoveIcon />}
            onClick={() => removeItem(param.value)}
          />
        </>
      ),
    },
  ];

  useEffect(() => {
    updateInventory();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => (setOpen(false), setCameraVisible(false));
  const handleChange = () => setCameraVisible(!cameraVisible);

  return (
    <Container
      sx={{
        minHeight: "100vh",
      }}
    >
      <Snackbar
        open={recipesMade}
        autoHideDuration={4000}
        onClose={(event, reason) => {
          if (reason === "clickaway") {
            return;
          }

          setRecipesMade(false);
        }}
        message="Recipes Generated"
      />
      <Modal open={open} onClose={handleClose}>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          width={400}
          bgcolor="white"
          border="2px solid #000"
          boxShadow={24}
          p={4}
          display="flex"
          flexDirection="column"
          gap={3}
          sx={{
            transform: "translate(-50%, -50%)",
          }}
        >
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="h6">Add New Item</Typography>
            {/* <FormControlLabel
              control={<Switch onChange={handleChange} />}
              label="Camera"
            /> */}
          </Stack>
          <Stack
            width="100%"
            direction="row"
            spacing={2}
            justifyContent="center"
          >
            {cameraVisible ? (
              <Stack direction="column" spacing={2}>
                <Box position="relative" height={400} width={300}>
                  <Camera ref={camera} />
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<CameraAltIcon />}
                  onClick={() => sendImage(camera.current.takePhoto())}
                >
                  Take a photo
                </Button>
              </Stack>
            ) : (
              <>
                <TextField
                  variant="outlined"
                  fullWidth
                  value={itemName}
                  placeholder="Spaghetti"
                  onChange={(e) => setItemName(e.target.value)}
                />
                <Button
                  variant="outlined"
                  onClick={() => {
                    addItem(itemName);
                    setItemName("");
                    handleClose();
                  }}
                >
                  Add
                </Button>
              </>
            )}
          </Stack>
        </Box>
      </Modal>
      <Box height="60vh">
        <Typography
          variant="h2"
          component="h1"
          textAlign="center"
          py={10}
          fontWeight={600}
        >
          Pantry Tracker
        </Typography>
        <Button onClick={handleOpen}>Add New Item</Button>
        {/* <Button onClick={getRecipes}>Generate Recipes</Button> */}
        <DataGrid
          rows={inventory}
          columns={columns}
          slots={{
            toolbar: GridToolbar,
          }}
          sx={{ boxShadow: 2 }}
        />
      </Box>
    </Container>
  );
}
