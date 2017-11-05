import React, { Component } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Picker,
  AppState,
  Platform,
  TextInput,
  AsyncStorage
} from 'react-native';
import RNFetchBlob from 'react-native-fetch-blob';
import PushController from './src/components/PushController';
import PushNotification from 'react-native-push-notification';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF'
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10
  },
  picker: {
    width: 100
  }
});

export default class App extends Component {
  constructor(props) {
    super(props);

    this.handleAppStateChange = this.handleAppStateChange.bind(this);
    this.state = {
      seconds: 5,
      question: "what's the hot new thing?",
      text: '',
      placeholder: 'the thing',
      editDate: ''
    };
  }

  componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChange);

    // 3 years = 1095 days
    const genArray = N => [
      ...(function*() {
        let i = 0;
        while (i < N) yield i++;
      })()
    ];
    const days = genArray(1095);
    // milliseconds per day
    const msPerDay = 1000 * 60 * 60 * 24;
    let dates = days.map(day => {
      // algo in comment form:
      //
      // convert Date.now() to 12a today
      // add enough ms to get to 10a today
      // add a random amount of ms between
      // 0 and enough ms to get to 11p today
      // add day * msPerDay offset
      return new Date(Date.now() + day * msPerDay);
    });

    // let date = new Date(Date.now() + this.state.seconds * 1000);

    if (Platform.OS === 'ios') {
      dates = dates.map(date => date.toISOString());
    }
    console.log('dates', dates);
    
    // schedule 3 years of notifications
    // TODO: add a way to cancel scheduled notifications
    dates.forEach(date => {
      PushNotification.localNotificationSchedule({
        message: this.state.question,
        date
      });
    });
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
  }

  handleAppStateChange(appState) {
    if (appState === 'background') {
      let date = new Date(Date.now() + this.state.seconds * 1000);
      // this.setState({ editDate: date.toISOString });
      if (Platform.OS === 'ios') {
        date = date.toISOString();
      }

      // PushNotification.localNotification({
      //   message: 'A message right away'
      // });

      // PushNotification.localNotificationSchedule({
      //   message: this.state.question,
      //   date
      // });
    }
  }

  async onEndEditing() {
    console.log('onEndEditing was called');
    if (typeof this.state.asyncStorageKeys === 'undefined') {
      this.setState({ asyncStorageKeys: [] });
    }
    this.setState({ editDate: new Date(Date.now()).toISOString() });
    console.log('this.state', this.state);
    this.setState({
      asyncStorageKeys: [
        ...this.state.asyncStorageKeys,
        `@HotNewThings${this.state.editDate}`
      ]
    });
    try {
      await AsyncStorage.setItem(
        `@HotNewThings${this.state.editDate}`,
        `${this.state.text}`
      );
    } catch (error) {
      // Error saving data
      console.error(error);
      this.asyncStorageKeys.pop();
    }

    try {
      const value = await AsyncStorage.getItem(
        `@HotNewThings${this.state.editDate}`
      );
      if (value !== null) {
        // We have data!!
        console.log(value);
      }
    } catch (error) {
      // Error retrieving data
      console.error(error);
    }

    console.log('this.state.asyncStorageKeys', this.state.asyncStorageKeys);
    try {
      const keys = await AsyncStorage.getAllKeys();
      const values = await AsyncStorage.multiGet(keys);
      if (values !== null) {
        // We have data!!
        console.log('values from AsyncStorage', values);
        const hotNewThings = values.filter(d => {
          console.log('d[0]', d[0]);
          console.log('d[0].substring(0, 12)', d[0].substring(0, 12));
          return d[0].substring(0, 13) === '@HotNewThings';
        });
        console.log('hotNewThings', hotNewThings);
        const answers = hotNewThings.map(d => d[1]);
        this.setState({ answers });

        // construct csvString
        const headerString = 'thing,timestamp\n';
        const rowString = hotNewThings
          .filter(d => {
            console.log('d[0].substring(13)', d[0].substring(13));
            return d[0].substring(13).length === 24;
          }) // is it an ISO timestamp?
          .map(d => `${d[1]},${d[0].substring(13)}\n`)
          .join('');
        const csvString = `${headerString}${rowString}`;

        // write the current list of answers to a local csv file
        const pathToWrite = `${RNFetchBlob.fs.dirs
          .DownloadDir}/hot-new-things.csv`;
        console.log('pathToWrite', pathToWrite);
        RNFetchBlob.fs
          .writeFile(pathToWrite, csvString, 'utf8')
          .then(() => {
            console.log(`wrote file ${pathToWrite}`);
          })
          .catch(error => console.error(error));
      }
    } catch (error) {
      // Error fetching data
      console.error(error);
    }
  }

  render() {
    const answers = this.state.answers ? this.state.answers.join(' ') : '';
    console.log('answers', answers);
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>{this.state.question}</Text>
        <TextInput
          style={{
            height: 40,
            width: 200,
            borderColor: '#F5FCFF',
            borderWidth: 1
          }}
          onChangeText={text => this.setState({ text })}
          onEndEditing={this.onEndEditing.bind(this)}
          editable={true}
          placeholder={this.state.placeholder}
          placeholderTextColor={'lightgray'}
          value={this.state.text}
        />
        <Text style={styles.welcome}>{answers}</Text>
        <PushController />
      </View>
    );
  }
}
