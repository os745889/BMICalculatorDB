import { useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as SQLite from "expo-sqlite";
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();
  setTimeout(SplashScreen.hideAsync, 2000);

  function openDatabase() {
    if (Platform.OS === "web") {
      return {
        transaction: () => {
          return {
            executeSql: () => {},
          };
        },
      };
    }
  
    const db = SQLite.openDatabase("db.db");
    return db;
  }
  
  const db = openDatabase();

  function Items() {
    const [items, setItems] = useState(null);
 
    useEffect(() => {
      db.transaction((tx) => {
        tx.executeSql(
          `select key, weight, height, bmi, date(itemDate) as itemDate from history order by itemDate desc;`,
          [],
          (_, { rows: { _array } }) => setItems(_array)
        );
        
      });
    }, []);

    if (items === null || items.length === 0) {
      return null;
    }
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>BMI History</Text>
        {items.map(({ key,weight,height,bmi,itemDate }) => (
            <Text style={styles.history}key={key}>{itemDate}: {bmi} (W:{weight}, H:{height})</Text>
        ))}
      </View>
    );
  }

  export default function App() {
    const [yourbmi, setYourBMI] = useState(null);
    const [weight, setWeight] = useState(null);
    const [height, setHeight] = useState(null);
    const [forceUpdate, forceUpdateId] = useForceUpdate();
  
    useEffect(() => {
      db.transaction((tx) => {
        tx.executeSql(
          "create table if not exists history (key integer primary key not null,weight int,height int,bmi int, itemDate real);"
        );
      });
    }, []);
  
    const add = (weight, height) => {
      if (weight === "" || weight === null || height === "" || height === null) {
        return false;
      }
      const bmi = ((weight/(height * height)) * 703).toFixed(1); 

      if(bmi < 18.5)
      {
        const yourbmi = "Body Mass Index is " + bmi + "\n" + '(Underweight)'
        setYourBMI(yourbmi);
      }
      else if (bmi > 18.5 && bmi < 24.9 )
      {
        const yourbmi = "Body Mass Index is " + bmi + "\n" + '(Healthy)'
        setYourBMI(yourbmi);
      }
      else if (bmi > 25.0 && bmi < 29.9)
      {
        const yourbmi = "Body Mass Index is " + bmi + "\n" + '(Overweight)'
        setYourBMI(yourbmi);
      }
      else 
      {
        const yourbmi = "Body Mass Index is " + bmi + "\n" + '(Obese)'
        setYourBMI(yourbmi);
      }


      db.transaction(
        (tx) => {
          tx.executeSql("insert into history (weight,height,bmi,itemDate) values (?,?,?,julianday('now'))",[weight, height,bmi]);
          tx.executeSql("select * from history", [], (_, { rows }) =>
            console.log(JSON.stringify(rows))
          );
        },
        null,
        forceUpdate
      );
    };

    return (
      <View style={styles.container}>
        <Text style={styles.toolbar}>BMI Calculator</Text>
        <ScrollView style={styles.text}>
              <TextInput
                onChangeText={(weight) => setWeight(weight)}
                placeholder="Weight in Pounds"
                style={styles.input}
                value={weight}
              />
              <TextInput
                onChangeText={(height) => setHeight(height)}
                placeholder="Height in Inches"
                style={styles.input}
                value={height}
              />
            <TouchableOpacity 
              onPress={() => {add(weight, height),setWeight(null),setHeight(null)}} style={styles.button}>
              <Text style={styles.buttonText}>Compute BMI</Text>
            </TouchableOpacity>
            <Text style={styles.text}>{yourbmi}</Text>
          <Items   
          />
           </ScrollView>
        
      </View>
    );
  }
  
  function useForceUpdate() {
    const [value, setValue] = useState(0);
    return [() => setValue(value + 1), value];
  }
  

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    toolbar: {
      backgroundColor: '#f4511e',
      color: '#fff',
      textAlign: 'center',
      padding: 25,
      fontSize: 24,
      fontWeight: 'bold'
    },
    input: {
      backgroundColor: '#ecf0f1',
      height: 40,
      padding: 5,
      marginBottom: 10,
    },
    button: {
      backgroundColor: '#34495e',
      padding: 10,
      borderRadius: 3,
      marginBottom: 30,
    },
    buttonText: {
      fontSize: 24,
      color: '#fff',
      textAlign: 'center'
    },
    bmi: {
      fontSize: 28,
    },
    text: {
      fontSize: 30,
      textAlign: 'center',
    },
    history : {
      fontSize: 20,
    },
    heading: {
      fontSize: 24,
    }
  });
  