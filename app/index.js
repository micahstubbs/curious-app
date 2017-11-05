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

    let date = new Date(Date.now() + this.state.seconds * 1000);

    if (Platform.OS === 'ios') {
      date = date.toISOString();
    }

    PushNotification.localNotificationSchedule({
      message: this.state.question,
      date
    });
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
  }

  handleAppStateChange(appState) {
    if (appState === 'background') {
      let date = new Date(Date.now() + this.state.seconds * 1000);
      this.setState({ editDate: date.toISOString });
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
    try {
      await AsyncStorage.setItem(
        `@HotNewThings${this.state.editDate}`,
        `${this.state.text}`
      );
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
      }
    } catch (error) {
      // Error retrieving data
      console.error(error);
    }
  }

  render() {
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
        <PushController />
      </View>
    );
  }
}
