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
  Snackbar,
} from "@mui/material";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import RemoveIcon from "@mui/icons-material/Remove";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import {
  GridRowModes,
  DataGrid,
  GridToolbarContainer,
  GridActionsCellItem,
  GridRowEditStopReasons,
  GridToolbarExport,
  GridToolbarQuickFilter,
  GridToolbarDensitySelector,
} from "@mui/x-data-grid";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { Camera } from "react-camera-pro";
import axios from "axios";
import RecipeList from "./components/RecipeList";

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [open, setOpen] = useState(false);
  const [loadOnce, setLoadOnce] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const camera = useRef(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [recipesMade, setRecipesMade] = useState(false);
  const [rowModesModel, setRowModesModel] = useState({});

  const handleRowEditStop = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  const handleSaveClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
  };

  const handleDeleteClick = (id) => async () => {
    const docRef = doc(firestore, "inventory", id);
    await deleteDoc(docRef);
    await updateInventory();
  };

  const handleCancelClick = (id) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });

    const editedRow = inventory.find((row) => row.id === id);
    if (editedRow.isNew) {
      setRows(rows.filter((row) => row.id !== id));
    }
  };

  const processRowUpdate = async (updatedItem) => {
    const docRef = doc(firestore, "inventory", updatedItem.id);
    await setDoc(docRef, {
      quantity: updatedItem.quantity,
      price: updatedItem.price,
      description: updatedItem.description,
    });
    await updateInventory();
    return { ...updatedItem, isNew: false };
  };

  const handleRowModesModelChange = (newRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  const updateInventory = async () => {
    const docs = await getDocs(collection(firestore, "inventory"));
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({
        id: doc.id,
        name: doc.id
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        item: doc.id,
        ...doc.data(),
      });
    });
    setInventory(inventoryList);
  };

  const addItem = async (
    item,
    numOfItems = 1,
    description = "",
    price = ""
  ) => {
    const docRef = doc(firestore, "inventory", item.toLowerCase());
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, {
        quantity: quantity + numOfItems,
        description: description,
        price: price,
      });
    } else {
      await setDoc(docRef, {
        quantity: numOfItems,
        description: description,
        price: price,
      });
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
        const recipesObj = JSON.parse(res.data.recipes.content);
        const newRecipes = [];
        for (const newRecipe in recipesObj) {
          newRecipes.push(recipesObj[newRecipe]);
        }
        setRecipes([...newRecipes]);
        console.log(recipesObj)
      })
      .catch((err) => {
        console.error("Unable to generate recipes at this time!", err);
      });
  };

  const EditToolbar = () => {
    return (
      <GridToolbarContainer
        sx={{ justifyContent: { xs: "center", sm: "space-between" } }}
      >
        <Stack direction={{ xs: "column", sm: "row" }}>
          <Button color="primary" startIcon={<AddIcon />} onClick={handleOpen}>
            Add New Item
          </Button>
          <Button
            color="primary"
            startIcon={<RestaurantIcon />}
            onClick={getRecipes}
            disabled={!inventory}
          >
            Generate Recipes
          </Button>
          <GridToolbarExport />
        </Stack>
        <GridToolbarQuickFilter />
      </GridToolbarContainer>
    );
  };

  const columns = [
    {
      field: "name",
      headerName: "Item Name",
      hideable: false,
      editable: false,
    },
    {
      type: "number",
      field: "price",
      headerName: "Price",
      editable: true,
      valueFormatter: (value) => {
        if (value == null || value === "") {
          return "";
        }
        return `$ ${value}`;
      },
    },
    {
      field: "quantity",
      headerName: "Quantity",
      type: "number",
      editable: true,
    },
    {
      field: "description",
      headerName: "Description",
      editable: true,
      flex: 1,
      sortable: false,
    },
    {
      field: "actions",
      type: "actions",
      minWidth: 150,
      headerName: "Actions",
      cellClassName: "actions",
      hideable: false,
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

        if (isInEditMode) {
          return [
            <GridActionsCellItem
              icon={<SaveIcon />}
              label="Save"
              sx={{
                color: "primary.main",
              }}
              onClick={handleSaveClick(id)}
            />,
            <GridActionsCellItem
              icon={<CancelIcon />}
              label="Cancel"
              className="textPrimary"
              onClick={handleCancelClick(id)}
              color="inherit"
            />,
          ];
        }

        return [
          <GridActionsCellItem
            icon={<AddIcon />}
            onClick={() => addItem(id)}
          />,
          <GridActionsCellItem
            icon={<RemoveIcon />}
            onClick={() => removeItem(id)}
          />,
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Edit"
            className="textPrimary"
            onClick={handleEditClick(id)}
            color="inherit"
          />,
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Delete"
            onClick={handleDeleteClick(id)}
            color="inherit"
          />,
        ];
      },
    },
  ];

  useEffect(() => {
    updateInventory();
    setLoadOnce(true);
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
        variant="success"
        message="Recipes Generated"
      />
      <Modal open={open} onClose={handleClose}>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          width={{ xs: "90vw", md: 500 }}
          border="2px solid #515151"
          bgcolor={"#121212"}
          borderRadius={5}
          p={4}
          display="flex"
          flexDirection="column"
          gap={3}
          sx={{
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* <Stack direction="row" justifyContent="space-between">
            <FormControlLabel
              control={<Switch onChange={handleChange} />}
              label="Camera"
            />
          </Stack> */}
          <Typography variant="h6" textAlign="center">
            Add New Item
          </Typography>
          <Stack width="100%" spacing={2} justifyContent="center">
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
              <Stack spacing={2}>
                <TextField
                  required
                  label="Name"
                  variant="outlined"
                  fullWidth
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
                <Stack direction="row" spacing={2}>
                  <TextField
                    required
                    variant="outlined"
                    fullWidth
                    value={itemQuantity}
                    label="Quantity"
                    type="number"
                    onChange={(e) => setItemQuantity(e.target.value)}
                    InputProps={{
                      inputProps: { min: 1 },
                    }}
                  />
                  <TextField
                    variant="outlined"
                    fullWidth
                    value={itemPrice}
                    placeholder="Price"
                    type="number"
                    onChange={(e) => setItemPrice(e.target.value)}
                    InputProps={{
                      inputProps: { step: 0.01 },
                    }}
                  />
                </Stack>
                <TextField
                  variant="outlined"
                  fullWidth
                  value={itemDesc}
                  placeholder="Description"
                  onChange={(e) => setItemDesc(e.target.value)}
                  multiline
                  rows={10}
                />
                <Button
                  variant="outlined"
                  disabled={!(itemName && Number(itemQuantity) > 0)}
                  onClick={() => {
                    addItem(itemName, Number(itemQuantity), itemDesc, itemPrice);
                    setItemName("");
                    setItemQuantity("");
                    setItemPrice("");
                    setItemDesc("");
                    handleClose();
                  }}
                >
                  Add
                </Button>
              </Stack>
            )}
          </Stack>
        </Box>
      </Modal>
      <Stack py={10}>
        <Typography variant="h2" component="h1" textAlign="center">
          Pantry Tracker
        </Typography>
        <Typography variant="subtitle1" textAlign="center">
          Manage all your items in your pantry efficiently.
        </Typography>
      </Stack>
      <Box height="60vh">
        <DataGrid
          loading={!loadOnce}
          rows={inventory}
          columns={columns}
          editMode="row"
          rowModesModel={rowModesModel}
          onRowModesModelChange={handleRowModesModelChange}
          onRowEditStop={handleRowEditStop}
          processRowUpdate={processRowUpdate}
          slots={{
            toolbar: EditToolbar,
          }}
          slotProps={{
            toolbar: { setInventory, setRowModesModel },
          }}
          disableRowSelectionOnClick
          disableColumnFilter
          disableColumnSelector
          getRowHeight={() => 'auto'}
          autosizeOptions={{
            includeOutliers: true,
          }}
        />
      </Box>
      {recipes.length > 0 && <RecipeList recipes={recipes} />}
    </Container>
  );
}
