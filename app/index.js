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
import moment from 'moment';

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

    // this.handleAppStateChange = this.handleAppStateChange.bind(this);
    this.state = {
      question: "what's the hot new thing?",
      text: '',
      placeholder: 'the thing',
      editDate: '',
      answers: [],
      asyncStorageKeys: []
    };
  }

  componentWillMount() {
    this.setAnswers();
  }

  componentDidMount() {
    // AppState.addEventListener('change', this.handleAppStateChange);
    this.checkNotifications();
    // this.removeNotificationsFlag();
  }

  componentWillUnmount() {
    // AppState.removeEventListener('change', this.handleAppStateChange);
  }

  async removeNotificationsFlag() {
    try {
      await AsyncStorage.removeItem(`@HotNewThingsNotifsToDate`);
    } catch (error) {
      // Error saving data
      console.error(error);
    }
  }

  async checkNotifications() {
    console.log('this.checkNotifications was called');
    // have we created notifications on this device before?
    try {
      const value = await AsyncStorage.getItem(`@HotNewThingsNotifsToDate`);
      if (value !== null) {
        // We have data - yes we have
        console.log('@HotNewThingsNotifsToDate', value);
      } else {
        // no we haven't created notifications on this device before
        // set the date
        const notifsToDate = moment()
          .add(1095, 'days')
          .toISOString();
        try {
          await AsyncStorage.setItem(`@HotNewThingsNotifsToDate`, notifsToDate);
        } catch (error) {
          // Error saving data
          console.error(error);
        }

        // schedule the notifications
        this.scheduleNotifications();
      }
    } catch (error) {
      // Error retrieving data
      console.error(error);
    }
  }

  scheduleNotifications() {
    // 3 years = 1095 days
    const genArray = N => [
      ...(function*() {
        let i = 0;
        while (i < N) yield i++;
      })()
    ];
    const days = genArray(1095);
    let dates = days.map(dayCount => {
      // convert Date.now() to 12a today
      const notifMoment = moment().startOf('day');

      // set time to 10a today
      notifMoment.hours(10);

      // add a random amount of time between
      // 10a and 11p today
      const randHours = Math.floor(Math.random() * 13);
      const randMinutes = Math.floor(Math.random() * 60);
      const randSeconds = Math.floor(Math.random() * 60);
      const randMilliseconds = Math.floor(Math.random() * 1000);
      notifMoment
        .add(randHours, 'hours')
        .add(randMinutes, 'minutes')
        .add(randSeconds, 'seconds')
        .add(randMilliseconds, 'milliseconds');

      // add dayCount
      notifMoment.add(dayCount, 'days');

      // convert to Javascript Date object
      const date = notifMoment.toDate();
      return date;
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

  // handleAppStateChange(appState) {
  //   if (appState === 'background') {
  //     let date = new Date(Date.now() + this.state.seconds * 1000);
  //     // this.setState({ editDate: date.toISOString });
  //     if (Platform.OS === 'ios') {
  //       date = date.toISOString();
  //     }

  //     PushNotification.localNotification({
  //       message: 'A message right away'
  //     });

  //     PushNotification.localNotificationSchedule({
  //       message: this.state.question,
  //       date
  //     });
  //   }
  // }

  async onEndEditing() {
    console.log('onEndEditing was called');
    // set the editDate
    this.setState({ editDate: moment().toISOString() });
    console.log('this.state', this.state);

    // store the hot new thing just entered
    // by the user in AsyncStorage on the device
    try {
      const setItemResult = await AsyncStorage.setItem(
        `@HotNewThings${this.state.editDate}`,
        `${this.state.text}`
      );
      if (setItemResult !== null) {
        // update the asyncStorage keys that we track
        // in the component state
        this.setState({
          asyncStorageKeys: [
            ...this.state.asyncStorageKeys,
            `@HotNewThings${this.state.editDate}`
          ]
        });
      }
    } catch (error) {
      // Error saving data
      console.error(error);
    }

    try {
      const value = await AsyncStorage.getItem(
        `@HotNewThings${this.state.editDate}`
      );
      if (value !== null) {
        // We have data!!
        console.log(value);
        this.setAnswers();
      }
    } catch (error) {
      // Error retrieving data
      console.error(error);
    }
  }

  // set the answers on local component state
  // write the answers to csv
  async setAnswers() {
    // console.log('this.state.asyncStorageKeys', this.state.asyncStorageKeys);
    try {
      const keys = await AsyncStorage.getAllKeys();
      const values = await AsyncStorage.multiGet(keys);
      if (values !== null) {
        // We have data!!
        // console.log('values from AsyncStorage', values);
        const hotNewThings = values
          .filter(d => {
            // console.log('d[0]', d[0]);
            // console.log('d[0].substring(0, 12)', d[0].substring(0, 12));
            return d[0].substring(0, 13) === '@HotNewThings';
          })
          .filter(d => {
            // console.log('d[0].substring(13)', d[0].substring(13));
            return d[0].substring(13).length === 24;
          }); // is it an ISO timestamp?;
        // console.log('hotNewThings', hotNewThings);
        const answers = hotNewThings.map(d => d[1]);
        this.setState({ answers });

        // write the answers to csv
        this.writeCsv({ hotNewThings });
      }
      if (keys !== null) {
        this.setState({ asyncStorageKeys: keys });
      }
    } catch (error) {
      // Error fetching data
      console.error(error);
    }
  }

  writeCsv(props) {
    const { hotNewThings } = props;
    // construct csvString
    const headerString = 'thing,timestamp\n';
    const rowString = hotNewThings
      .map(d => `${d[1]},${d[0].substring(13)}\n`)
      .join('');
    const csvString = `${headerString}${rowString}`;

    // write the current list of answers to a local csv file
    const pathToWrite = `${RNFetchBlob.fs.dirs.DownloadDir}/hot-new-things.csv`;
    console.log('pathToWrite', pathToWrite);
    RNFetchBlob.fs
      .writeFile(pathToWrite, csvString, 'utf8')
      .then(() => {
        console.log(`wrote file ${pathToWrite}`);
      })
      .catch(error => console.error(error));
  }

  render() {
    const answers = this.state.answers ? this.state.answers.join(' ') : '';
    console.log('answers from render | ', answers);
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
