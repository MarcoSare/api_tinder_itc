const functions = require("firebase-functions");
const express = require("express");
const admin = require("firebase-admin");

const app = express();
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();
app.get("/hello", (req, res) => {
  return res.status(200).json({ message: "hello" });
});



app.get("/usuarios", async (req, res) => {
  const query = db.collection("usuarios");
  const querySnapshot = await query.get();
  const docs = querySnapshot.docs;
  const response = docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
    aboutMe: doc.data().aboutMe,
    birthdate: doc.data().birthdate,
    carrer: doc.data().carrer,
    email: doc.data().email,
    gender: doc.data().gender,
    interests: doc.data().interests,
    profile_picture: doc.data().profile_picture,
    semester: doc.data().semester,
    tokenDevice: doc.data().tokenDevice,
  }));
  return res.status(200).json(response);
});

function filterAll({ user, filter }) {
  if (filter === "Todos") return true;
  return user === filter;
}

function filterAge({ user, filter }) {
  if (filter === "Todos") return true;
  const birthdate = new Date(user);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - birthdate.getTime());
  const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
  console.log("diff age" + diffYears);
  return filter[0] <= diffYears && filter[1] >= diffYears;
}

function isNotInArray(listLikes, id) {
  const isInArray = listLikes.some((likeId) => likeId === id);
  console.log("______________________________________");
  console.log(id);
  console.log(!isInArray);
  console.log("______________________________________");
  return !isInArray;
}

function getAge({user}){
  const birthdate = new Date(user);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - birthdate.getTime());
  const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
  return diffYears;
}

app.post("/usuarios/like/:id", async (req, res) => {
  const likes = (
    await db
      .collection("usuarios")
      .doc(req.params.id)
      .collection("likes")
      .where("idUser", "==", req.body.idTo)
      .get()
  ).docs;

  if (likes.length > 0) {
    await db
      .collection("usuarios")
      .doc(req.params.id)
      .collection("matchs")
      .doc(req.body.idTo)
      .create({
        last_msg: "",
      });

    await db
      .collection("usuarios")
      .doc(req.params.id)
      .collection("likes")
      .where("idUser", "==", req.body.idTo)
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          doc.ref
            .delete()
            .then(() => {
              console.log("Documento borrado exitosamente.");
            })
            .catch((error) => {
              console.error("Error al borrar documento:", error);
            });
        });
      })
      .catch((error) => {
        console.error("Error al obtener documentos:", error);
      });

    await db
      .collection("usuarios")
      .doc(req.params.id)
      .collection("yourLikes")
      .where("idUser", "==", req.body.idTo)
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          doc.ref
            .delete()
            .then(() => {
              console.log("Documento borrado exitosamente.");
            })
            .catch((error) => {
              console.error("Error al borrar documento:", error);
            });
        });
      })
      .catch((error) => {
        console.error("Error al obtener documentos:", error);
      });

    await db
      .collection("usuarios")
      .doc(req.body.idTo)
      .collection("yourLikes")
      .where("idUser", "==", req.params.id)
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          doc.ref
            .delete()
            .then(() => {
              console.log("Documento borrado exitosamente.");
            })
            .catch((error) => {
              console.error("Error al borrar documento:", error);
            });
        });
      })
      .catch((error) => {
        console.error("Error al obtener documentos:", error);
      });
    await db
      .collection("usuarios")
      .doc(req.body.idTo)
      .collection("likes")
      .where("idUser", "==", req.params.id)
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          doc.ref
            .delete()
            .then(() => {
              console.log("Documento borrado exitosamente.");
            })
            .catch((error) => {
              console.error("Error al borrar documento:", error);
            });
        });
      })
      .catch((error) => {
        console.error("Error al obtener documentos:", error);
      });

    await db
      .collection("usuarios")
      .doc(req.body.idTo)
      .collection("matchs")
      .doc(req.params.id)
      .create({
        last_msg: "",
      });

    return res.status(200).json({ isMatch: true });
  } else {
    return res.status(200).json({ isMatch: false });
  }
});

app.get("/usuarios/:id", async (req, res) => {
  const filter = (
    await db
      .collection("usuarios")
      .doc(req.params.id)
      .collection("filters")
      .get()
  ).docs;

  const gender = filter[0].data().gender;
  const carrer = filter[0].data().carrer;
  const ages = filter[0].data().ages;

  const query = db
    .collection("usuarios")
    .doc(req.params.id)
    .collection("yourLikes");
  const querySnapshot = await query.get();
  const docs = querySnapshot.docs;
  var listLikes = [];
  docs.forEach((like) => {
    listLikes.push(like.data().idUser);
  });

  const queryMatch = db
    .collection("usuarios")
    .doc(req.params.id)
    .collection("matchs");
  const querySnapshotMatch = await queryMatch.get();
  const docsMatch = querySnapshotMatch.docs;

  docsMatch.forEach((match) => {
    listLikes.push(match.id);
  });

  listLikes.push(req.params.id);
  listLikes.map((w) => console.log(w));

  //console.log(listLikes);
  const queryUsers = db.collection("usuarios");

  const querySnapshotUsers = await queryUsers.get();
  const docsUsers = querySnapshotUsers.docs;
  docsUsers.map((e) => console.log(e.data().uid));

  const response = docsUsers
    .filter(
      (doc) =>
        isNotInArray(listLikes, doc.data().uid) &&
        filterAge({ user: doc.data().birthdate, filter: ages }) &&
        filterAll({ user: doc.data().gender, filter: gender }) &&
        filterAll({ user: doc.data().carrer, filter: carrer })
    )
    .map((doc) => ({
      id: doc.id,
      name: doc.data().name,
      aboutMe: doc.data().aboutMe,
      birthdate: doc.data().birthdate,
      carrer: doc.data().carrer,
      email: doc.data().email,
      gender: doc.data().gender,
      interests: doc.data().interests,
      profile_picture: doc.data().profile_picture,
      semester: doc.data().semester,
      tokenDevice: doc.data().tokenDevice,
      age : getAge({user: doc.data().birthdate})
    }));

  return res.status(200).json(response);
});

exports.app = functions.https.onRequest(app);
// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
